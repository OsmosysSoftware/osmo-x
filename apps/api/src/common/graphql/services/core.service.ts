import { Injectable, Logger } from '@nestjs/common';
import { Repository, Brackets, SelectQueryBuilder } from 'typeorm';
import { QueryOptionsDto, SortOrder } from '../dtos/query-options.dto';
import { PaginationQueryDto } from '../../dto/pagination-query.dto';
import { PaginationHelper, PaginationMeta } from '../../utils/pagination.helper';
import { Status } from '../../constants/database';

/**
 * Optional callback that lets domain services append additional WHERE clauses
 * to a query builder. Runs after base conditions and the bracketed free-text
 * search are applied, before sort/paging — so its andWhere() composes safely
 * with the parenthesized search expression.
 */
export type ExtraFiltersFn<T> = (qb: SelectQueryBuilder<T>, alias: string) => void;

/**
 * Keys of the notification `data` column that carry pg_trgm GIN expression indexes
 * (see migrations 1774000000100 and 1774800000000). Free-text search targets these
 * instead of casting the whole jsonb document to text, which no index can serve.
 */
const TRIGRAM_INDEXED_DATA_KEYS = ['to', 'cc', 'bcc', 'target', 'from', 'subject'] as const;

/** Aliases whose `data` column has the trigram indexes above. */
const TRIGRAM_INDEXED_ALIASES = ['notification', 'archivedNotification'];

/**
 * Fields the notification list endpoints expose to free-text `?search=`.
 *
 * Deliberately just `data` — which expands to the trigram-indexed keys above. `result` and
 * `createdBy` were removed: neither can be index-served, and a single unindexed OR arm makes the
 * planner discard the BitmapOr and scan the whole table. Measured over 1.46M archived rows,
 * including `result` cost 18.5s versus 7.6ms without it. The dedicated recipient/sender/subject
 * filters are unaffected.
 */
export const NOTIFICATION_SEARCHABLE_FIELDS = ['data'];

/**
 * Base-condition fields that are always applied for tenancy/soft-delete scoping rather than by
 * user intent. A query carrying only these has not been narrowed by the caller.
 */
const SCOPING_CONDITION_FIELDS = new Set(['status', 'applicationId', 'organizationId']);

@Injectable()
export abstract class CoreService<TEntity> {
  protected readonly logger = new Logger(CoreService.name);

  constructor(protected readonly repository: Repository<TEntity>) {}

  // List of date fields for comparison handling
  private dateFields: string[] = ['createdOn', 'updatedOn']; // Customize based on your entity fields

  // List of jsonb fields used for data search
  private jsonbFields: string[] = ['data', 'result', 'configuration', 'whitelistRecipients']; // Customize based on your entity fields

  private isDateField(field: string): boolean {
    return this.dateFields.includes(field);
  }

  private isJsonbColumn(field: string): boolean {
    return this.jsonbFields.includes(field);
  }

  /** True for the notification `data` column, which has per-key trigram indexes. */
  private isTrigramIndexedJsonbColumn(alias: string, field: string): boolean {
    return field === 'data' && TRIGRAM_INDEXED_ALIASES.includes(alias);
  }

  async findAll(
    options: QueryOptionsDto,
    alias: string,
    searchableFields: string[] = [],
    baseConditions: Array<{ field: string; value: unknown; operator?: string }> = [],
    applyExtraFilters?: ExtraFiltersFn<TEntity>,
    withRelations = true,
  ): Promise<{ items: TEntity[]; total: number }> {
    const queryBuilder = this.buildListQuery(
      options,
      alias,
      searchableFields,
      baseConditions,
      applyExtraFilters,
      withRelations,
    );

    const [items, total] = await queryBuilder.getManyAndCount();
    return { items, total };
  }

  /**
   * Builds the filtered, sorted, paginated query shared by every list path.
   * Executing it — and whether to pay for a COUNT — is left to the caller.
   */
  private buildListQuery(
    options: QueryOptionsDto,
    alias: string,
    searchableFields: string[] = [],
    baseConditions: Array<{ field: string; value: unknown; operator?: string }> = [],
    applyExtraFilters?: ExtraFiltersFn<TEntity>,
    withRelations = true,
  ): SelectQueryBuilder<TEntity> {
    this.logger.log(`Getting all ${alias} with options`);

    const queryBuilder = this.repository.createQueryBuilder(alias);

    // Perform a Left Join to fetch and display related entityDetails (filter joined entities by active status)
    //
    // Joining is opt-in because it is far from free on the notification tables. With any join
    // present, TypeORM abandons plain LIMIT/OFFSET for its distinct-id strategy (a SELECT DISTINCT
    // wrapping a subquery that materialises every column, including both jsonb blobs) and
    // downgrades getManyAndCount()'s COUNT(1) to COUNT(DISTINCT id). Over 1.46M archived rows that
    // measured 8.2s for the count alone. The GraphQL resolvers expose applicationDetails as a
    // non-nullable @Field so they keep the join; the REST list path never reads it and opts out.
    if (withRelations && (alias === 'notification' || alias === 'archivedNotification')) {
      queryBuilder.leftJoinAndSelect(
        `${alias}.applicationDetails`,
        'application',
        'application.status = :joinStatus',
        { joinStatus: Status.ACTIVE },
      );
    } else if (alias === 'providerChain') {
      queryBuilder.leftJoinAndSelect(
        `${alias}.applicationDetails`,
        'application',
        'application.status = :joinStatus',
        { joinStatus: Status.ACTIVE },
      );
    } else if (alias === 'providerChainMember') {
      queryBuilder.leftJoinAndSelect(
        `${alias}.providerDetails`,
        'provider',
        'provider.status = :providerJoinStatus',
        { providerJoinStatus: Status.ACTIVE },
      );
      queryBuilder.leftJoinAndSelect(
        `${alias}.providerChainDetails`,
        'provider-chain',
        '"provider-chain".status = :chainJoinStatus',
        { chainJoinStatus: Status.ACTIVE },
      );
    }

    // Apply base conditions
    baseConditions.forEach((condition, idx) => {
      const paramName = `base_${idx}`;

      if (condition.operator === 'in') {
        queryBuilder.andWhere(`${alias}.${condition.field} IN (:...${paramName})`, {
          [paramName]: condition.value,
        });
      } else if (condition.operator === 'gte') {
        queryBuilder.andWhere(`${alias}.${condition.field} >= :${paramName}`, {
          [paramName]: condition.value,
        });
      } else if (condition.operator === 'lte') {
        queryBuilder.andWhere(`${alias}.${condition.field} <= :${paramName}`, {
          [paramName]: condition.value,
        });
      } else {
        queryBuilder.andWhere(`${alias}.${condition.field} = :${paramName}`, {
          [paramName]: condition.value,
        });
      }
    });

    // Implement search with OR condition using searchableFields
    if (options.search && searchableFields.length > 0) {
      queryBuilder.andWhere(
        new Brackets((qb) => {
          searchableFields.forEach((field) => {
            if (this.isTrigramIndexedJsonbColumn(alias, field)) {
              // CAST(data AS text) LIKE '%x%' cannot use any index and forces a full detoast of
              // every jsonb document. Searching the individual trigram-indexed keys instead keeps
              // the same practical reach for users while staying index-served.
              // The alias must be double-quoted: TypeORM does not rewrite an `alias.column`
              // reference once a `->>` operator follows it, so an unquoted camelCase alias would
              // reach PostgreSQL folded to lowercase and fail with "missing FROM-clause entry".
              qb.orWhere(
                new Brackets((inner) => {
                  TRIGRAM_INDEXED_DATA_KEYS.forEach((key) => {
                    inner.orWhere(`"${alias}".${field}->>'${key}' ILIKE :search`, {
                      search: `%${options.search}%`,
                    });
                  });
                }),
              );
            } else if (this.isJsonbColumn(field)) {
              qb.orWhere(`CAST(${alias}.${field} AS text) LIKE :search`, {
                search: `%${options.search}%`,
              });
            } else {
              qb.orWhere(`${alias}.${field} LIKE :search`, { search: `%${options.search}%` });
            }
          });
        }),
      );
    }

    // Domain-specific extra filters (e.g. notification data JSON predicates).
    // The previous andWhere(new Brackets(...)) ensures the OR group is parenthesized,
    // so subsequent andWhere() calls compose safely.
    if (applyExtraFilters) {
      applyExtraFilters(queryBuilder, alias);
    }

    // Dynamic filters with special handling for date fields
    options.filters?.forEach((filter, index) => {
      const field = filter.field;
      const operator = filter.operator;
      const paramName = `param${index}`;
      let condition = `${alias}.${field}`;
      let value = filter.value;

      if (operator === 'in' && typeof value === 'string') {
        try {
          // Attempt to parse the string as JSON to convert it into an array
          value = JSON.parse(value);
        } catch (error) {
          throw new Error(`Error parsing value for 'in' operator: ${error.message}`);
        }
      } else if (this.isDateField(field) && (operator === 'gt' || operator === 'lt')) {
        value = new Date(value) as unknown as string;
      }

      switch (operator) {
        case 'eq':
          condition += ` = :${paramName}`;
          break;
        case 'contains':
          // Only cast jsonb fields in Postgres
          condition = this.isJsonbColumn(field)
            ? `CAST(${alias}.${field} AS text) LIKE :${paramName}`
            : `${alias}.${field} LIKE :${paramName}`;
          break;
        case 'gt':
          condition += ` > :${paramName}`;
          break;
        case 'lt':
          condition += ` < :${paramName}`;
          break;
        case 'gte':
          condition += ` >= :${paramName}`;
          break;
        case 'lte':
          condition += ` <= :${paramName}`;
          break;
        case 'ne':
          condition += ` != :${paramName}`;
          break;
        case 'in':
          condition += ` IN (:...${paramName})`;
          break;
        // Add other operators as needed
      }

      queryBuilder.andWhere(condition, {
        [paramName]: operator === 'contains' ? `%${value}%` : value,
      });
    });

    // Pagination and Sorting
    //
    // skip()/take() exist to paginate entities correctly when a join can multiply rows; they cost
    // an extra distinct-id round trip. With no join in play there is nothing to de-duplicate, so
    // offset()/limit() emit plain LIMIT/OFFSET straight against the index.
    const hasJoin = queryBuilder.expressionMap.joinAttributes.length > 0;

    if (hasJoin) {
      if (options.offset !== undefined) queryBuilder.skip(options.offset);

      if (options.limit !== undefined) queryBuilder.take(options.limit);
    } else {
      if (options.offset !== undefined) queryBuilder.offset(options.offset);

      if (options.limit !== undefined) queryBuilder.limit(options.limit);
    }

    // options.sortBy is interpolated into the ORDER BY, so it must be a real column on this
    // entity — PaginationHelper.validateSortField exists for this but was never wired up. Using
    // the entity metadata as the allowlist keeps it correct for every endpoint automatically;
    // anything unrecognised falls back to the default ordering instead of reaching the database.
    const sortBy = this.resolveSortField(options.sortBy);

    if (sortBy) {
      queryBuilder.orderBy(`${alias}.${sortBy}`, options.sortOrder || 'ASC');
    } else {
      queryBuilder.orderBy(`${alias}.createdOn`, 'DESC');
    }

    return queryBuilder;
  }

  /** Returns the sort field only if it is a real, sortable column on this entity. */
  private resolveSortField(sortBy?: string): string | null {
    if (!sortBy) {
      return null;
    }

    const sortableFields = this.repository.metadata.columns.map((column) => column.propertyName);

    return PaginationHelper.validateSortField(sortBy, sortableFields);
  }

  /**
   * Page-based pagination for REST endpoints.
   * Converts PaginationQueryDto (page/limit) to offset internally
   * and delegates to the existing findAll query builder.
   */
  async findAllPaginated(
    query: PaginationQueryDto,
    alias: string,
    searchableFields: string[] = [],
    baseConditions: Array<{ field: string; value: unknown; operator?: string }> = [],
    applyExtraFilters?: ExtraFiltersFn<TEntity>,
  ): Promise<{ items: TEntity[]; total: number; meta: PaginationMeta }> {
    const { page, limit, offset, sort } = PaginationHelper.normalizePaginationParams(query);

    const options: QueryOptionsDto = {
      offset,
      limit,
      sortBy: sort?.field,
      sortOrder: sort?.order === 'desc' ? SortOrder.DESC : SortOrder.ASC,
      search: query.search,
    };

    // REST list responses never read the joined applicationDetails, so opt out of the join and
    // the distinct-id pagination it drags along.
    const { items, total, isEstimate, hasNext } = await this.findAllForRest(
      options,
      alias,
      searchableFields,
      baseConditions,
      applyExtraFilters,
      this.hasNarrowingFilters(query, baseConditions),
    );
    const meta = PaginationHelper.buildPaginationMeta(page, limit, total, { isEstimate, hasNext });

    return { items, total, meta };
  }

  /**
   * REST list query. Identical filtering to findAll, but joins are skipped and the exact
   * COUNT is avoided when the query is broad.
   *
   * An exact COUNT over notify_archived_notifications is an index-only scan of ~1.46M rows —
   * ~1.6s on every request, which no index removes. When the caller has narrowed the set with
   * real predicates the count is cheap and stays exact; when they are just browsing everything
   * we fall back to the planner's estimate and derive has_next from an extra fetched row, so
   * paging stays correct even though the grand total is approximate.
   */
  private async findAllForRest(
    options: QueryOptionsDto,
    alias: string,
    searchableFields: string[],
    baseConditions: Array<{ field: string; value: unknown; operator?: string }>,
    applyExtraFilters: ExtraFiltersFn<TEntity> | undefined,
    narrowed: boolean,
  ): Promise<{ items: TEntity[]; total: number; isEstimate: boolean; hasNext: boolean }> {
    const limit = options.limit ?? PaginationHelper.getDefaultLimit();
    const offset = options.offset ?? 0;

    // Fetch one extra row so has_next is exact regardless of how total is derived.
    const rows = await this.buildListQuery(
      { ...options, limit: limit + 1 },
      alias,
      searchableFields,
      baseConditions,
      applyExtraFilters,
      false,
    ).getMany();

    const hasNext = rows.length > limit;
    const items = hasNext ? rows.slice(0, limit) : rows;

    // Everything fits on this page — we already know the exact total, for free.
    if (!hasNext && offset === 0) {
      return { items, total: items.length, isEstimate: false, hasNext };
    }

    // A narrowed query has cut the row count far enough that an exact COUNT is cheap.
    if (narrowed) {
      const total = await this.buildListQuery(
        { ...options, offset: undefined, limit: undefined },
        alias,
        searchableFields,
        baseConditions,
        applyExtraFilters,
        false,
      ).getCount();

      return { items, total, isEstimate: false, hasNext };
    }

    const estimate = await this.estimateRowCount();

    return {
      items,
      total: Math.max(estimate, offset + items.length),
      isEstimate: true,
      hasNext,
    };
  }

  /**
   * A query counts as narrow when the caller supplied a real predicate — free-text search, one of
   * the `data` filters, or a base condition beyond the always-present org/status scoping. Those cut
   * the row count far enough that an exact COUNT is cheap.
   *
   * Note this inspects the filter *values*, not whether an extra-filters callback was provided:
   * the notification services pass that callback unconditionally, so its presence says nothing
   * about whether the user actually narrowed anything.
   */
  private hasNarrowingFilters(
    query: PaginationQueryDto,
    baseConditions: Array<{ field: string; value: unknown; operator?: string }>,
  ): boolean {
    const dataFilters = [
      query.search,
      query.recipient,
      query.sender,
      query.subject,
      query.message_body,
      query.template_name,
    ];

    if (dataFilters.some(Boolean)) {
      return true;
    }

    if (query.data_filter && Object.keys(query.data_filter).length > 0) {
      return true;
    }

    return baseConditions.some((condition) => !SCOPING_CONDITION_FIELDS.has(condition.field));
  }

  /**
   * Planner row estimate for this entity's table. Cheap (reads pg_class) and good enough for a
   * page count on a "browse everything" query. Falls back to an exact count if unavailable.
   */
  private async estimateRowCount(): Promise<number> {
    const tableName = this.repository.metadata.tableName;

    const rows: Array<{ estimate: string }> = await this.repository.query(
      'SELECT reltuples::bigint AS estimate FROM pg_class WHERE oid = $1::regclass',
      [tableName],
    );

    const estimate = Number(rows?.[0]?.estimate ?? -1);

    // reltuples is -1 on a table that has never been analysed.
    return estimate >= 0 ? estimate : this.repository.count();
  }
}

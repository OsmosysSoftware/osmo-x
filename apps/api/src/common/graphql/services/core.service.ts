import { Injectable, Logger } from '@nestjs/common';
import { Repository, Brackets } from 'typeorm';
import { QueryOptionsDto } from '../dtos/query-options.dto';

@Injectable()
export abstract class CoreService<TEntity> {
  protected readonly logger = new Logger(CoreService.name);

  constructor(protected readonly repository: Repository<TEntity>) {}

  // List of date fields for comparison handling
  private dateFields: string[] = ['createdOn', 'updatedOn']; // Customize based on your entity fields

  private isDateField(field: string): boolean {
    return this.dateFields.includes(field);
  }

  async findAll(
    options: QueryOptionsDto,
    alias: string,
    searchableFields: string[] = [],
    baseConditions: Array<{ field: string; value: unknown; operator?: string }> = [],
  ): Promise<{ items: TEntity[]; total: number }> {
    this.logger.log(`Getting all ${alias} with options`);

    const queryBuilder = this.repository.createQueryBuilder(alias);

    // Perform a Left Join to fetch and display related applicationDetails & providerDetails
    // For 'notification' or 'archivedNotification' findAll
    if (alias === 'notification' || alias === 'archivedNotification') {
      queryBuilder.leftJoinAndSelect(`${alias}.applicationDetails`, 'application');
      queryBuilder.leftJoinAndSelect(`${alias}.providerDetails`, 'provider');
    }

    if (alias === 'serverApiKeys') {
      queryBuilder.leftJoinAndSelect(`${alias}.applicationDetails`, 'application');
    }

    // Apply base conditions
    baseConditions.forEach((condition) => {
      queryBuilder.andWhere(`${alias}.${condition.field} = :${condition.field}`, {
        [condition.field]: condition.value,
      });
    });

    // Implement search with OR condition using searchableFields
    if (options.search && searchableFields.length > 0) {
      queryBuilder.andWhere(
        new Brackets((qb) => {
          searchableFields.forEach((field) => {
            qb.orWhere(`${alias}.${field} LIKE :search`, { search: `%${options.search}%` });
          });
        }),
      );
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
          condition += ` LIKE :${paramName}`;
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
    if (options.offset !== undefined) queryBuilder.skip(options.offset);
    if (options.limit !== undefined) queryBuilder.take(options.limit);
    if (options.sortBy)
      queryBuilder.orderBy(`${alias}.${options.sortBy}`, options.sortOrder || 'ASC');

    const [items, total] = await queryBuilder.getManyAndCount();
    return { items, total };
  }
}

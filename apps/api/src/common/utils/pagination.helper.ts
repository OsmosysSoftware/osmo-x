/**
 * Pagination Helper Utilities
 * Offset-based pagination with sorting support
 * Following Zalando RESTful API Guidelines (with documented deviation)
 *
 * Deviation Rationale:
 * - Using offset-based instead of cursor-based for:
 *   1. Better UX (page numbers, flexible sorting)
 *   2. Simpler implementation and debugging
 *   3. Sufficient performance for our dataset size (<100k records)
 *   4. PostgreSQL with proper indexes handles offset efficiently
 */

export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total_items: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface SortConfig {
  field: string;
  order: 'asc' | 'desc';
}

export class PaginationHelper {
  private static readonly DEFAULT_PAGE = 1;
  private static readonly DEFAULT_LIMIT = 20;
  private static readonly MAX_LIMIT = 1000;
  private static readonly MIN_LIMIT = 1;

  /**
   * Convert snake_case to camelCase.
   * Used for converting API sort parameter to entity property name.
   */
  private static snakeToCamel(str: string): string {
    return str.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
  }

  /**
   * Normalize and validate pagination parameters
   */
  static normalizePaginationParams(params: PaginationParams): {
    page: number;
    limit: number;
    offset: number;
    sort?: SortConfig;
  } {
    const page = Math.max(this.DEFAULT_PAGE, params.page || this.DEFAULT_PAGE);
    const limit = this.validateLimit(params.limit);
    const offset = (page - 1) * limit;

    const result: {
      page: number;
      limit: number;
      offset: number;
      sort?: SortConfig;
    } = { page, limit, offset };

    if (params.sort) {
      result.sort = {
        field: this.snakeToCamel(params.sort),
        order: params.order || 'desc',
      };
    }

    return result;
  }

  /**
   * Validate and constrain limit within allowed range
   */
  static validateLimit(limit?: number): number {
    if (limit === undefined || limit === null) {
      return this.DEFAULT_LIMIT;
    }

    const numLimit = Number(limit);

    if (isNaN(numLimit) || numLimit < this.MIN_LIMIT) {
      return this.DEFAULT_LIMIT;
    }

    return Math.min(numLimit, this.MAX_LIMIT);
  }

  /**
   * Calculate total pages from total items and page size
   */
  static calculateTotalPages(totalItems: number, limit: number): number {
    if (totalItems === 0) return 0;
    return Math.ceil(totalItems / limit);
  }

  /**
   * Build pagination metadata
   */
  static buildPaginationMeta(
    page: number,
    limit: number,
    totalItems: number,
  ): PaginationMeta {
    const totalPages = this.calculateTotalPages(totalItems, limit);

    return {
      page,
      limit,
      total_items: totalItems,
      total_pages: totalPages,
      has_next: page < totalPages,
      has_prev: page > 1,
    };
  }

  /**
   * Parse sort string from query parameter.
   * Format: "field" or "-field" (prefix with - for descending)
   */
  static parseSortString(sortString: string): SortConfig {
    if (sortString.startsWith('-')) {
      return {
        field: sortString.substring(1),
        order: 'desc',
      };
    }

    return {
      field: sortString,
      order: 'asc',
    };
  }

  /**
   * Validate sort field against allowed fields
   */
  static validateSortField(field: string, allowedFields: string[]): string | null {
    return allowedFields.includes(field) ? field : null;
  }

  static getDefaultPage(): number {
    return this.DEFAULT_PAGE;
  }

  static getDefaultLimit(): number {
    return this.DEFAULT_LIMIT;
  }

  static getMaxLimit(): number {
    return this.MAX_LIMIT;
  }
}

/**
 * Generic Paginated Response DTO
 * Used as the return type for v1 collection endpoints
 *
 * Response format follows Zalando RESTful API Guidelines:
 * {
 *   "items": [...],
 *   "self": "https://host/api/v1/resource?page=1&limit=20",
 *   "first": "https://host/api/v1/resource?page=1&limit=20",
 *   "last": "https://host/api/v1/resource?page=5&limit=20",
 *   "next": "https://host/api/v1/resource?page=2&limit=20",
 *   "prev": null,
 *   "page_info": { "page": 1, "limit": 20, "total_items": 100, ... }
 * }
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationMeta } from '../utils/pagination.helper';
import { CollectionLinks } from '../utils/link-builder.helper';

export class PageInfoDto {
  @ApiProperty({ description: 'Current page number', example: 1 })
  page: number;

  @ApiProperty({ description: 'Items per page', example: 20 })
  limit: number;

  @ApiProperty({ description: 'Total number of items', example: 100 })
  total_items: number;

  @ApiProperty({ description: 'Total number of pages', example: 5 })
  total_pages: number;

  @ApiProperty({ description: 'Whether a next page exists', example: true })
  has_next: boolean;

  @ApiProperty({ description: 'Whether a previous page exists', example: false })
  has_prev: boolean;
}

export class PaginatedResponse<T> {
  @ApiProperty({ description: 'Array of items', isArray: true })
  items: T[];

  @ApiProperty({
    description: 'Self link',
    example: 'https://host/api/v1/resource?page=1&limit=20',
  })
  self: string;

  @ApiProperty({ description: 'First page link' })
  first: string;

  @ApiProperty({ description: 'Last page link' })
  last: string;

  @ApiPropertyOptional({ description: 'Next page link (null if last page)', nullable: true })
  next: string | null;

  @ApiPropertyOptional({ description: 'Previous page link (null if first page)', nullable: true })
  prev: string | null;

  @ApiProperty({ description: 'Pagination metadata', type: PageInfoDto })
  page_info: PaginationMeta;

  constructor(items: T[], links: CollectionLinks, pageInfo: PaginationMeta) {
    this.items = items;
    this.self = links.self;
    this.first = links.first;
    this.last = links.last;
    this.next = links.next ?? null;
    this.prev = links.prev ?? null;
    this.page_info = pageInfo;
  }
}

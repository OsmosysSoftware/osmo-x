/**
 * Shared Pagination Query DTO
 * Used as @Query() parameter in v1 collection endpoints
 */

import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  Max,
  Validate,
} from 'class-validator';
import { IsDataFilterMap } from '../validators/is-data-filter-map.validator';

export class PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Page number (1-based)',
    minimum: 1,
    default: 1,
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    description: 'Items per page',
    minimum: 1,
    maximum: 1000,
    default: 20,
    example: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000)
  limit?: number;

  @ApiPropertyOptional({
    description: 'Field to sort by (snake_case, e.g. created_on)',
    example: 'created_on',
  })
  @IsOptional()
  @IsString()
  sort?: string;

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: ['asc', 'desc'],
    default: 'desc',
    example: 'desc',
  })
  @IsOptional()
  @IsString()
  order?: 'asc' | 'desc';

  @ApiPropertyOptional({
    description: 'Search text (searches across data, result, and createdBy fields)',
    example: 'user@example.com',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    name: 'recipient',
    description:
      'Match against notification recipients. Searches data.to, data.cc, data.bcc, ' +
      'and data.target (push). Supports both string and array values.',
    example: 'jane@example.com',
  })
  @IsOptional()
  @IsString()
  @MaxLength(254)
  recipient?: string;

  @ApiPropertyOptional({
    name: 'sender',
    description: 'Match against email From address (data.from).',
    example: 'noreply@example.com',
  })
  @IsOptional()
  @IsString()
  @MaxLength(254)
  sender?: string;

  @ApiPropertyOptional({
    name: 'subject',
    description: 'Match against email subject (data.subject).',
    example: 'Invoice',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  subject?: string;

  @ApiPropertyOptional({
    name: 'message_body',
    description:
      'Match against message body. Searches data.text, data.html, data.message, ' +
      'data.text.body (WhatsApp), and data.message.default (push). HTML markup is ' +
      'included in the search.',
    example: 'password reset',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  message_body?: string;

  @ApiPropertyOptional({
    name: 'template_name',
    description:
      'Match against WhatsApp template name (data.template.name). ' +
      'Applies to 360Dialog and Twilio WhatsApp Business providers.',
    example: 'ir_incident_resolution',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  template_name?: string;

  @ApiPropertyOptional({
    name: 'data_filter',
    description:
      'Top-level key/value pairs to match against the notification data JSON. ' +
      'Repeat as data_filter[key]=value. Keys must match ^[a-zA-Z0-9_]{1,64}$ and ' +
      'are AND-combined. Swagger UI: rendered with style: deepObject via @ApiQuery ' +
      'on the controller.',
    type: 'object',
    additionalProperties: { type: 'string' },
    example: { template: 'otp_v2', locale: 'en' },
  })
  @IsOptional()
  @IsObject()
  @Validate(IsDataFilterMap)
  data_filter?: Record<string, string>;
}

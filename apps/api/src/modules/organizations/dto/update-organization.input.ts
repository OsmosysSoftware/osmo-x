import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

export class UpdateOrganizationInput {
  @ApiProperty({ description: 'ID of the organization to update', example: 1 })
  @IsInt()
  @IsNotEmpty()
  organizationId: number;

  @ApiPropertyOptional({ description: 'Organization display name', example: 'Acme Corp' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'URL-friendly slug (lowercase, alphanumeric, hyphens)',
    example: 'acme-corp',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug must be lowercase alphanumeric with hyphens',
  })
  slug?: string;
}

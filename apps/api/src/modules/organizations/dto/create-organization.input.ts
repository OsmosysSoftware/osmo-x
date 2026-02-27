import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class CreateOrganizationInput {
  @ApiProperty({ description: 'Organization name', example: 'Acme Corp' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'URL-friendly slug (lowercase, alphanumeric, hyphens only)',
    example: 'acme-corp',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug must be lowercase, alphanumeric with hyphens only',
  })
  slug: string;
}

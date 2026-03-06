import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProviderResponseDto {
  @ApiProperty({ description: 'Provider ID', example: 1 })
  providerId: number;

  @ApiProperty({ description: 'Provider name', example: 'Primary SMTP' })
  name: string;

  @ApiProperty({
    description: 'Notification channel: 0=SMTP, 1=Mailgun, 2=AWS SES, etc.',
    example: 0,
  })
  channelType: number;

  @ApiProperty({ description: 'Whether provider is enabled (0=disabled, 1=enabled)', example: 1 })
  isEnabled: number;

  @ApiProperty({
    description: 'Whether this provider has configuration set',
    example: true,
  })
  hasConfiguration: boolean;

  @ApiProperty({ description: 'Associated application ID', example: 1 })
  applicationId: number;

  @ApiProperty({ description: 'Creator user ID', example: 1 })
  userId: number;

  @ApiProperty({ description: 'Status: 1=Active, 0=Inactive', example: 1 })
  status: number;

  @ApiPropertyOptional({ description: 'ID of user who created this record', example: 1 })
  createdBy: number | null;

  @ApiPropertyOptional({ description: 'ID of user who last updated this record', example: 1 })
  updatedBy: number | null;

  @ApiProperty({ description: 'Creation timestamp', format: 'date-time' })
  createdOn: Date;

  @ApiProperty({ description: 'Last update timestamp', format: 'date-time' })
  updatedOn: Date;
}

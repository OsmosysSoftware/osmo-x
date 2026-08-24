import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class WebhookResponseDto {
  @ApiProperty({ description: 'Webhook ID', example: 1 })
  id: number;

  @ApiProperty({ description: 'Associated provider ID', example: 1 })
  providerId: number;

  @ApiProperty({
    description: 'Webhook callback URL',
    example: 'https://example.com/webhooks/notifications',
  })
  webhookUrl: string;

  @ApiProperty({ description: 'Whether the webhook URL has been verified', example: 0 })
  isVerified: number;

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

  @ApiPropertyOptional({
    description: 'Delivery status of the most recent attempt: 1=Success, 2=Failed',
    example: 1,
  })
  lastDeliveryStatus: number | null;

  @ApiPropertyOptional({
    description: 'Timestamp of the most recent delivery attempt',
    format: 'date-time',
  })
  lastAttemptedAt: Date | null;
}

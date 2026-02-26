import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ArchivedNotificationResponseDto {
  @ApiProperty({ description: 'Archived notification record ID', example: 1 })
  id: number;

  @ApiProperty({ description: 'Original notification ID', example: 42 })
  notificationId: number;

  @ApiProperty({ description: 'Provider ID used for delivery', example: 1 })
  providerId: number;

  @ApiProperty({
    description: 'Notification channel: 0=SMTP, 1=Mailgun, 2=AWS SES, etc.',
    example: 0,
  })
  channelType: number;

  @ApiProperty({
    description: 'Notification payload data',
    example: { to: 'user@example.com', subject: 'Hello', body: 'World' },
  })
  data: Record<string, unknown>;

  @ApiProperty({
    description:
      'Delivery status: 0=Pending, 1=In Progress, 2=Awaiting Confirmation, 3=Success, 4=Failed',
    example: 3,
  })
  deliveryStatus: number;

  @ApiPropertyOptional({
    description: 'Provider response result',
    example: { messageId: 'abc-123' },
  })
  result?: Record<string, unknown>;

  @ApiProperty({ description: 'User or API key that created the notification', example: 'admin' })
  createdBy: string;

  @ApiProperty({
    description: 'User or API key that last updated the notification',
    example: 'admin',
  })
  updatedBy: string;

  @ApiProperty({ description: 'Status: 1=Active, 0=Inactive', example: 1 })
  status: number;

  @ApiProperty({ description: 'Associated application ID', example: 1 })
  applicationId: number;

  @ApiProperty({ description: 'Number of delivery retry attempts', example: 0 })
  retryCount: number;

  @ApiPropertyOptional({ description: 'Timestamp when notification was sent', format: 'date-time' })
  notificationSentOn?: Date;

  @ApiPropertyOptional({ description: 'Associated provider chain ID', example: 1 })
  providerChainId?: number;

  @ApiProperty({ description: 'Creation timestamp', format: 'date-time' })
  createdOn: Date;

  @ApiProperty({ description: 'Last update timestamp', format: 'date-time' })
  updatedOn: Date;
}

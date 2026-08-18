import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class WebhookLogResponseDto {
  @ApiProperty({ description: 'Webhook log ID', example: 1 })
  id: number;

  @ApiProperty({ description: 'Associated webhook ID', example: 1 })
  webhookId: number;

  @ApiProperty({ description: 'Associated notification ID', example: 1 })
  notificationId: number;

  @ApiProperty({ description: 'Attempt number for this delivery', example: 1 })
  attemptNumber: number;

  @ApiProperty({ description: 'Delivery status: 1=Success, 2=Failed', example: 1 })
  status: number;

  @ApiPropertyOptional({ description: 'HTTP status code returned by the partner', example: 200 })
  httpStatusCode: number | null;

  @ApiPropertyOptional({ description: 'Payload sent to the partner for this attempt (truncated)' })
  requestBody: unknown;

  @ApiPropertyOptional({ description: 'Response body returned by the partner (truncated)' })
  responseBody: unknown;

  @ApiPropertyOptional({ description: 'Error message, if the attempt failed' })
  errorMessage: string | null;

  @ApiProperty({ description: 'When this attempt was made', format: 'date-time' })
  requestedAt: Date;

  @ApiProperty({ description: 'Log row creation timestamp', format: 'date-time' })
  createdOn: Date;
}

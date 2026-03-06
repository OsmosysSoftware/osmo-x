import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString } from 'class-validator';

export class UpdateWebhookInput {
  @ApiProperty({ description: 'ID of the webhook to update', example: 1 })
  @IsInt()
  @IsNotEmpty()
  id: number;

  @ApiProperty({
    description: 'New webhook callback URL',
    example: 'https://example.com/webhooks/notifications',
  })
  @IsString()
  @IsNotEmpty()
  webhookUrl: string;
}

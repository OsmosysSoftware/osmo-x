import { InputType, Field } from '@nestjs/graphql';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

@InputType()
export class CreateWebhookInput {
  @ApiProperty({ description: 'ID of the provider to associate the webhook with', example: 1 })
  @Field()
  @IsNotEmpty()
  providerId: number;

  @ApiProperty({
    description: 'URL that will receive webhook notifications',
    example: 'https://example.com/webhooks/notifications',
  })
  @Field()
  @IsNotEmpty()
  webhookUrl: string;
}

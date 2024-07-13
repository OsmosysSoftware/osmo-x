import { InputType, Field } from '@nestjs/graphql';
import { IsNotEmpty } from 'class-validator';

@InputType()
export class CreateWebhookInput {
  @Field()
  @IsNotEmpty()
  providerId: number;

  @Field()
  @IsNotEmpty()
  webhookUrl: string;
}

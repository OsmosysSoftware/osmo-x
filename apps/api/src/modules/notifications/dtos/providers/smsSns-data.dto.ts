import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class SmsSnsDataDto {
  @IsNotEmpty()
  @MaxLength(16)
  to: string;

  @IsString()
  @IsNotEmpty()
  // Max length as per https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/Package/-aws-sdk-client-sns/Interface/PublishCommandInput/
  @MaxLength(1600)
  message: string;
}

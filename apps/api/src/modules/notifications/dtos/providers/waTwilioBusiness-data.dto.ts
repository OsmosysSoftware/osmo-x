import { IsNotEmpty, IsObject } from 'class-validator';

export class WaTwilioBusinessDataDto {
  @IsNotEmpty()
  contentSid: string;

  @IsNotEmpty()
  from: string;

  @IsNotEmpty()
  @IsObject()
  contentVariables: object;

  @IsNotEmpty()
  to: string;
}

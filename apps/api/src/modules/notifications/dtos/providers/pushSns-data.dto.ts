import { IsNotEmpty } from 'class-validator';

export class PushSnsDataDto {
  @IsNotEmpty()
  target: string;

  @IsNotEmpty()
  message: object;
}

import { IsNotEmpty } from 'class-validator';

export class PushSnsDataDto {
  @IsNotEmpty()
  target: string;

  @IsNotEmpty()
  title: string;

  @IsNotEmpty()
  body: string;
}

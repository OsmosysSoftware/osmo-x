import { IsNumber, IsObject } from 'class-validator';
import { IsDataValid } from 'src/common/decorators/is-data-valid.decorator';

export class CreateNotificationDto {
  @IsNumber()
  providerId: number;

  @IsObject()
  @IsDataValid()
  data: Record<string, unknown>;
}

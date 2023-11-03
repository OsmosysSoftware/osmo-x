import { IsEnum, IsObject } from 'class-validator';
import { ChannelType } from 'src/common/constants/notifications';
import { IsDataValid } from 'src/common/decorators/is-data-valid.decorator';

export class CreateNotificationDto {
  @IsEnum(ChannelType)
  channelType: number;

  @IsObject()
  @IsDataValid()
  data: Record<string, unknown>;
}

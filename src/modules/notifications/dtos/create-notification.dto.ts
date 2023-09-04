import { IsEnum, IsObject } from 'class-validator';
import { ChannelType } from 'src/common/constants/notifications';

export class CreateNotificationDto {
  @IsEnum(ChannelType)
  channelType: number;

  @IsObject()
  data: Record<string, unknown>;
}

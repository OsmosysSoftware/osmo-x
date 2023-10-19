import { IsEnum, IsObject } from 'class-validator';
import { ChannelType } from 'src/common/constants/notifications';

export class CreateNotificationDto {
  @IsEnum(ChannelType)
  channelType: number;

  @IsObject()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any>;
}

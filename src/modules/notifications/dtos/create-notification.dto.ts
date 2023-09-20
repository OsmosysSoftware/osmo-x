import { Type } from 'class-transformer';
import { IsEnum, IsObject, ValidateNested } from 'class-validator';
import { ChannelType } from 'src/common/constants/notifications';
import { CreateNotificationDataDto } from './create-notification-data.dto';

export class CreateNotificationDto {
  @IsEnum(ChannelType)
  channelType: number;

  @IsObject()
  @ValidateNested()
  @Type(() => CreateNotificationDataDto)
  data: CreateNotificationDataDto;
}

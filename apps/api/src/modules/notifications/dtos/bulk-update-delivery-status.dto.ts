import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsIn, IsOptional, IsString, ValidateIf } from 'class-validator';
import { DeliveryStatus } from 'src/common/constants/notifications';

const ALLOWED_STATUSES = [DeliveryStatus.PENDING, DeliveryStatus.SUCCESS, DeliveryStatus.FAILED];

export class BulkUpdateDeliveryStatusDto {
  @ApiProperty({
    type: [Number],
    description: 'IDs of notifications to update',
    example: [100, 200, 300],
  })
  @IsArray()
  @ArrayMinSize(1)
  @Type(() => Number)
  notificationIds: number[];

  @ApiProperty({
    enum: ALLOWED_STATUSES,
    description: '1=PENDING, 5=SUCCESS, 6=FAILED',
    example: 5,
  })
  @IsIn(ALLOWED_STATUSES)
  deliveryStatus: number;

  @ApiPropertyOptional({
    description: 'Comment explaining the override (required for SUCCESS and FAILED)',
    example: 'Messages were delivered but got stuck in OsmoX',
  })
  @ValidateIf(
    (o: BulkUpdateDeliveryStatusDto) =>
      o.deliveryStatus === DeliveryStatus.SUCCESS || o.deliveryStatus === DeliveryStatus.FAILED,
  )
  @IsString()
  comment?: string;

  @ApiPropertyOptional({
    description: 'Display name of the person making the override (used in the result field)',
    example: 'Jagrat Singh',
  })
  @IsOptional()
  @IsString()
  updatedBy?: string;
}

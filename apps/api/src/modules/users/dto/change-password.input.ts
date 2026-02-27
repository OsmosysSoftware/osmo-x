import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ChangePasswordInput {
  @ApiProperty({ description: 'Current password', example: 'OldP@ssw0rd' })
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @ApiProperty({ description: 'New password (min 6 characters)', example: 'NewP@ssw0rd' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  newPassword: string;
}

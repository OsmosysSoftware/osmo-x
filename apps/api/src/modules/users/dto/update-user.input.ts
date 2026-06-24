import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { UserRoles } from 'src/common/constants/database';

export class UpdateUserInput {
  @ApiProperty({ description: 'User ID to update', example: 1 })
  @IsInt()
  @IsNotEmpty()
  userId: number;

  @ApiPropertyOptional({ description: 'New email address', example: 'john.doe@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'First name', example: 'John' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ description: 'Last name', example: 'Doe' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({
    description: 'New password (min 6 characters)',
    example: 'newpassword123',
  })
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @ApiPropertyOptional({
    description: 'Application IDs this user is permitted to access (for NOTIFICATION_VIEWER)',
    example: [1, 2, 3],
    type: [Number],
  })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  permittedApplicationIds?: number[];

  @ApiPropertyOptional({
    description: 'User role: 0=OrgUser, 1=OrgAdmin, 3=NotificationViewer',
    example: 0,
    enum: [UserRoles.ORG_USER, UserRoles.ORG_ADMIN, UserRoles.NOTIFICATION_VIEWER],
  })
  @IsOptional()
  @IsEnum([UserRoles.ORG_USER, UserRoles.ORG_ADMIN, UserRoles.NOTIFICATION_VIEWER])
  userRole?: number;
}

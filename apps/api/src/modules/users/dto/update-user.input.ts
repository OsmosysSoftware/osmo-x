import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
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
    description: 'User role: 0=OrgUser, 1=OrgAdmin',
    example: 0,
    enum: [UserRoles.ORG_USER, UserRoles.ORG_ADMIN],
  })
  @IsOptional()
  @IsEnum([UserRoles.ORG_USER, UserRoles.ORG_ADMIN])
  userRole?: number;
}

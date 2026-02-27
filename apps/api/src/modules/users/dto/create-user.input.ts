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

export class CreateUserInput {
  @ApiProperty({
    description: 'User email address (used as login)',
    example: 'john.doe@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'User password (min 6 characters)', example: 'password123' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({ description: 'First name', example: 'John' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ description: 'Last name', example: 'Doe' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({
    description: 'User role: 0=OrgUser, 1=OrgAdmin',
    example: 0,
    enum: [UserRoles.ORG_USER, UserRoles.ORG_ADMIN],
  })
  @IsEnum([UserRoles.ORG_USER, UserRoles.ORG_ADMIN])
  userRole: number;

  @ApiPropertyOptional({
    description: 'Target organization ID (SUPER_ADMIN only, defaults to own org)',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  organizationId?: number;
}

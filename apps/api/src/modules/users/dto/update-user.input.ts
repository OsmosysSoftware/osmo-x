import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { UserRoles } from 'src/common/constants/database';

export class UpdateUserInput {
  @ApiProperty({ description: 'User ID to update', example: 1 })
  @IsInt()
  @IsNotEmpty()
  userId: number;

  @ApiPropertyOptional({ description: 'New username', example: 'john.doe' })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiPropertyOptional({
    description: 'New password (min 6 characters)',
    example: 'newpassword123',
  })
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @ApiPropertyOptional({ description: 'User email address', example: 'john.doe@example.com' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({
    description: 'User role: 0=OrgUser, 1=OrgAdmin',
    example: 0,
    enum: [UserRoles.ORG_USER, UserRoles.ORG_ADMIN],
  })
  @IsOptional()
  @IsEnum([UserRoles.ORG_USER, UserRoles.ORG_ADMIN])
  userRole?: number;
}

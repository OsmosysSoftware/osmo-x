import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { UserRoles } from 'src/common/constants/database';

export class CreateUserInput {
  @ApiProperty({ description: 'Unique login username', example: 'john.doe' })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({ description: 'User password (min 6 characters)', example: 'password123' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({ description: 'User email address', example: 'john.doe@example.com' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiProperty({
    description: 'User role: 0=OrgUser, 1=OrgAdmin',
    example: 0,
    enum: [UserRoles.ORG_USER, UserRoles.ORG_ADMIN],
  })
  @IsEnum([UserRoles.ORG_USER, UserRoles.ORG_ADMIN])
  userRole: number;
}

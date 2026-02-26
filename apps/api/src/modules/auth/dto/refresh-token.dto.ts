import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Refresh token received from login or previous refresh',
  })
  @IsString()
  @MinLength(1, { message: 'Refresh token is required' })
  refreshToken: string;
}

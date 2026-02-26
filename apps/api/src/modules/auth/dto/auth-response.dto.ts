import { ApiProperty } from '@nestjs/swagger';

class AuthUserData {
  @ApiProperty({ example: 1 })
  userId: number;

  @ApiProperty({ example: 'admin' })
  username: string;

  @ApiProperty({ example: 1, description: '0=OrgUser, 1=OrgAdmin, 2=SuperAdmin' })
  role: number;

  @ApiProperty({ example: 1 })
  organizationId: number;

  @ApiProperty({ example: 'admin@example.com', required: false })
  email?: string;
}

export class AuthResponseDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT access token',
  })
  accessToken: string;

  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT refresh token (longer expiration)',
  })
  refreshToken: string;

  @ApiProperty({ type: AuthUserData, description: 'Authenticated user data' })
  user: AuthUserData;

  @ApiProperty({
    example: 604800,
    description: 'Access token expiration time in seconds',
  })
  expiresIn: number;
}

import { Field, ObjectType } from '@nestjs/graphql';
import { ApiProperty } from '@nestjs/swagger';

@ObjectType()
export class LoginResponse {
  @ApiProperty({
    description: 'JWT access token for authenticating subsequent requests',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @Field()
  token: string;
}

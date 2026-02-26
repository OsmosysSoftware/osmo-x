import { InputType, Field } from '@nestjs/graphql';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

@InputType()
export class LoginUserInput {
  @ApiProperty({ description: 'Username for authentication', example: 'admin' })
  @Field()
  @IsNotEmpty()
  username: string;

  @ApiProperty({ description: 'Password for authentication', example: 'P@ssw0rd123' })
  @Field()
  @IsNotEmpty()
  password: string;
}

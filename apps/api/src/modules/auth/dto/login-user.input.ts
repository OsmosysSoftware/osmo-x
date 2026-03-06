import { InputType, Field } from '@nestjs/graphql';
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

@InputType()
export class LoginUserInput {
  @ApiProperty({ description: 'Email for authentication', example: 'admin@osmox.dev' })
  @Field()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Password for authentication', example: 'P@ssw0rd123' })
  @Field()
  @IsNotEmpty()
  password: string;
}

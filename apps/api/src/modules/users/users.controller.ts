import { Controller, Post, Body, Logger, HttpException } from '@nestjs/common';
import { JsendFormatter } from 'src/common/jsend-formatter';
import { UsersService } from './users.service';
import { CreateUserInput } from './dto/create-user.input';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly jsend: JsendFormatter,
    private logger: Logger,
  ) {}

  @Post()
  async addUser(@Body() userData: CreateUserInput): Promise<Record<string, unknown>> {
    try {
      const createdUser = await this.usersService.createUser(userData);
      this.logger.log('User created successfully.');
      return this.jsend.success({ notification: createdUser });
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error('Error while creating user');
      this.logger.error(JSON.stringify(error, ['message', 'stack'], 2));
      return this.jsend.error(error.message);
    }
  }
}

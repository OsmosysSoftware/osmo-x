import { Logger, Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { JsendFormatter } from 'src/common/jsend-formatter';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [UsersService, JsendFormatter, Logger],
  exports: [TypeOrmModule],
  controllers: [UsersController],
})
export class UsersModule {}

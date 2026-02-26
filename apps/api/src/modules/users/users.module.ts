import { Logger, Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersV1Controller } from './users-v1.controller';
import { User } from './entities/user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JsendFormatter } from 'src/common/jsend-formatter';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [TypeOrmModule.forFeature([User]), JwtModule],
  providers: [UsersService, JsendFormatter, Logger],
  controllers: [UsersV1Controller],
  exports: [TypeOrmModule],
})
export class UsersModule {}

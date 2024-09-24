import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JsendFormatter } from 'src/common/jsend-formatter';
import { Provider } from './entities/provider.entity';
import { ProvidersService } from './providers.service';
import { IsDataValidConstraint } from 'src/common/decorators/is-data-valid.decorator';
import { ProvidersResolver } from './providers.resolver';
import { ApplicationsService } from '../applications/applications.service';
import { ApplicationsModule } from '../applications/applications.module';
import { UsersModule } from '../users/users.module';
import { UsersService } from '../users/users.service';
import { Logger } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
@Module({
  imports: [TypeOrmModule.forFeature([Provider]), UsersModule, ApplicationsModule, JwtModule],
  providers: [
    UsersService,
    ApplicationsService,
    JwtService,
    ProvidersService,
    JsendFormatter,
    IsDataValidConstraint,
    ProvidersResolver,
    Logger,
  ],
  exports: [TypeOrmModule, ProvidersService, UsersService, ApplicationsService],
})
export class ProvidersModule {}

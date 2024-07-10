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
import { ServerApiKeysService } from '../server-api-keys/server-api-keys.service';
import { ServerApiKeysModule } from '../server-api-keys/server-api-keys.module';
import { Logger } from '@nestjs/common';
@Module({
  imports: [
    TypeOrmModule.forFeature([Provider]),
    UsersModule,
    ApplicationsModule,
    ServerApiKeysModule,
  ],
  providers: [
    UsersService,
    ApplicationsService,
    ServerApiKeysService,
    ProvidersService,
    JsendFormatter,
    IsDataValidConstraint,
    ProvidersResolver,
    Logger,
  ],
  exports: [TypeOrmModule, ProvidersService, UsersService, ApplicationsService],
})
export class ProvidersModule {}

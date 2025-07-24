import { Logger, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProviderChain } from './entities/provider-chain.entity';
import { ProviderChainsService } from './provider-chains.service';
import { ProviderChainsResolver } from './provider-chains.resolver';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ProviderChainsController } from './provider-chains.controller';
import { ApplicationsService } from '../applications/applications.service';
import { ApplicationsModule } from '../applications/applications.module';
import { UsersService } from '../users/users.service';
import { UsersModule } from '../users/users.module';
import { ProvidersService } from '../providers/providers.service';
import { ProvidersModule } from '../providers/providers.module';
import { JsendFormatter } from 'src/common/jsend-formatter';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProviderChain]),
    JwtModule,
    ApplicationsModule,
    UsersModule,
    ProvidersModule,
  ],
  providers: [
    Logger,
    ProviderChainsService,
    ProviderChainsResolver,
    JwtService,
    ConfigService,
    ApplicationsService,
    UsersService,
    ProvidersService,
    JsendFormatter,
  ],
  exports: [TypeOrmModule, ProviderChainsService],
  controllers: [ProviderChainsController],
})
export class ProviderChainsModule {}

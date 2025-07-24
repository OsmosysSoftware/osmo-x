import { Logger, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProviderChain } from './entities/provider-chain.entity';
import { ProviderChainsService } from './provider-chains.service';
import { ProviderChainsResolver } from './provider-chains.resolver';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ProviderChainsController } from './provider-chains.controller';
import { JsendFormatter } from 'src/common/jsend-formatter';
import { ApplicationsModule } from '../applications/applications.module';
import { ApplicationsService } from '../applications/applications.service';
import { UsersModule } from '../users/users.module';
import { UsersService } from '../users/users.service';
import { ProvidersModule } from '../providers/providers.module';
import { ProvidersService } from '../providers/providers.service';
import { ProviderChainMembersModule } from '../provider-chain-members/provider-chain-members.module';
import { ProviderChainMembersService } from '../provider-chain-members/provider-chain-members.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProviderChain]),
    JwtModule,
    ApplicationsModule,
    UsersModule,
    ProvidersModule,
    ProviderChainMembersModule,
  ],
  providers: [
    Logger,
    ProviderChainsService,
    ProviderChainsResolver,
    JwtService,
    ConfigService,
    JsendFormatter,
    ApplicationsService,
    UsersService,
    ProvidersService,
    ProviderChainMembersService,
  ],
  exports: [TypeOrmModule, ProviderChainsService],
  controllers: [ProviderChainsController],
})
export class ProviderChainsModule {}

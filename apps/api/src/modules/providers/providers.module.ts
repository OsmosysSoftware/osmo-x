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
import { ConfigService } from '@nestjs/config';
import { ProviderChainsModule } from '../provider-chains/provider-chains.module';
import { ProviderChainsService } from '../provider-chains/provider-chains.service';
import { ProviderChainMembersModule } from '../provider-chain-members/provider-chain-members.module';
import { ProviderChainMembersService } from '../provider-chain-members/provider-chain-members.service';
@Module({
  imports: [
    TypeOrmModule.forFeature([Provider]),
    UsersModule,
    ApplicationsModule,
    JwtModule,
    ProviderChainsModule,
    ProviderChainMembersModule,
  ],
  providers: [
    UsersService,
    ApplicationsService,
    JwtService,
    ProvidersService,
    ConfigService,
    JsendFormatter,
    IsDataValidConstraint,
    ProvidersResolver,
    Logger,
    ProviderChainsService,
    ProviderChainMembersService,
  ],
  exports: [
    TypeOrmModule,
    ProvidersService,
    UsersService,
    ApplicationsService,
    ProviderChainsService,
    ProviderChainMembersService,
  ],
})
export class ProvidersModule {}

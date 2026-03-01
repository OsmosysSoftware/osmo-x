import { forwardRef, Logger, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProviderChainMember } from './entities/provider-chain-member.entity';
import { ProviderChainMembersService } from './provider-chain-members.service';
import { ProviderChainMembersResolver } from './provider-chain-members.resolver';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ProviderChainMembersController } from './provider-chain-members.controller';
import { ProvidersModule } from '../providers/providers.module';
import { ProviderChainsModule } from '../provider-chains/provider-chains.module';
import { MasterProvidersModule } from '../master-providers/master-providers.module';
import { ApplicationsModule } from '../applications/applications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProviderChainMember]),
    JwtModule,
    forwardRef(() => ProvidersModule),
    forwardRef(() => ProviderChainsModule),
    MasterProvidersModule,
    ApplicationsModule,
  ],
  providers: [
    Logger,
    ProviderChainMembersService,
    ProviderChainMembersResolver,
    JwtService,
    ConfigService,
  ],
  exports: [TypeOrmModule, ProviderChainMembersService],
  controllers: [ProviderChainMembersController],
})
export class ProviderChainMembersModule {}

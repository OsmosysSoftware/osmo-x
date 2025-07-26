import { forwardRef, Logger, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProviderChainMember } from './entities/provider-chain-member.entity';
import { ProviderChainMembersService } from './provider-chain-members.service';
import { ProviderChainMembersResolver } from './provider-chain-members.resolver';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ProviderChainMembersController } from './provider-chain-members.controller';
import { ProvidersModule } from '../providers/providers.module';
import { ProviderChainsService } from '../provider-chains/provider-chains.service';
import { ProviderChainsModule } from '../provider-chains/provider-chains.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProviderChainMember]),
    JwtModule,
    ProvidersModule,
    forwardRef(() => ProviderChainsModule),
  ],
  providers: [
    Logger,
    ProviderChainMembersService,
    ProviderChainMembersResolver,
    JwtService,
    ConfigService,
    ProviderChainsService,
  ],
  exports: [TypeOrmModule, ProviderChainMembersService],
  controllers: [ProviderChainMembersController],
})
export class ProviderChainMembersModule {}

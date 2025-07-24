import { Logger, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProviderChain } from './entities/provider-chain.entity';
import { ProviderChainsService } from './provider-chains.service';
import { ProviderChainsResolver } from './provider-chains.resolver';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [TypeOrmModule.forFeature([ProviderChain]), JwtModule],
  providers: [Logger, ProviderChainsService, ProviderChainsResolver, JwtService, ConfigService],
  exports: [TypeOrmModule, ProviderChainsService],
})
export class ProviderChainsModule {}

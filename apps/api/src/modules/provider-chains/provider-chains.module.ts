import { Logger, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProviderChain } from './entities/provider-chain.entity';
import { ProviderChainsService } from './provider-chains.service';

@Module({
  imports: [TypeOrmModule.forFeature([ProviderChain])],
  providers: [Logger, ProviderChainsService],
  exports: [TypeOrmModule, ProviderChainsService],
})
export class ProviderChainsModule {}

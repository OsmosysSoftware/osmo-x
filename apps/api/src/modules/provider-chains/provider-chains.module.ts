import { Logger, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProviderChain } from './entities/provider-chain.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ProviderChain])],
  providers: [Logger],
  exports: [TypeOrmModule],
})
export class ProviderChainsModule {}

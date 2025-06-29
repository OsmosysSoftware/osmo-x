import { Logger, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProviderChainMember } from './entities/provider-chain-member.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ProviderChainMember])],
  providers: [Logger],
  exports: [TypeOrmModule],
})
export class ProviderChainMembersModule {}

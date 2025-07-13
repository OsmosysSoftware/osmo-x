import { Logger, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProviderChainMember } from './entities/provider-chain-member.entity';
import { ProviderChainMembersService } from './provider-chain-members.service';

@Module({
  imports: [TypeOrmModule.forFeature([ProviderChainMember])],
  providers: [Logger, ProviderChainMembersService],
  exports: [TypeOrmModule],
})
export class ProviderChainMembersModule {}

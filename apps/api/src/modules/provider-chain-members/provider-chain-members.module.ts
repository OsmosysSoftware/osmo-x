import { Logger, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProviderChainMember } from './entities/provider-chain-member.entity';
import { ProviderChainMembersService } from './provider-chain-members.service';
import { ProviderChainMembersResolver } from './provider-chain-members.resolver';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [TypeOrmModule.forFeature([ProviderChainMember]), JwtModule],
  providers: [
    Logger,
    ProviderChainMembersService,
    ProviderChainMembersResolver,
    JwtService,
    ConfigService,
  ],
  exports: [TypeOrmModule, ProviderChainMembersService],
})
export class ProviderChainMembersModule {}

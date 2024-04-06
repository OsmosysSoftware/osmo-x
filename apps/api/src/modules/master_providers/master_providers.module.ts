import { Module } from '@nestjs/common';
import { MasterProvidersService } from './master_providers.service';
import { MasterProvidersResolver } from './master_providers.resolver';

@Module({
  providers: [MasterProvidersResolver, MasterProvidersService],
})
export class MasterProvidersModule {}

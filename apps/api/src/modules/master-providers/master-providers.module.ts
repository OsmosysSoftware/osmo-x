import { Module } from '@nestjs/common';
import { MasterProvidersService } from './master-providers.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MasterProvider } from './entities/master-provider.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MasterProvider])],
  providers: [MasterProvidersService],
  exports: [TypeOrmModule, MasterProvidersService],
})
export class MasterProvidersModule {}

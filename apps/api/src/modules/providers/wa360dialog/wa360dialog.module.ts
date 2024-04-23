import { Module } from '@nestjs/common';
import { Wa360dialogService } from './wa360dialog.service';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { ProvidersModule } from '../providers.module';
import { ProvidersService } from '../providers.service';

@Module({
  imports: [HttpModule, ConfigModule, ProvidersModule],
  providers: [Wa360dialogService, ProvidersService],
  exports: [Wa360dialogService],
})
export class Wa360dialogModule {}

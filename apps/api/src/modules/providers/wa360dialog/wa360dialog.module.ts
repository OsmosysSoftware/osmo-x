import { Module } from '@nestjs/common';
import { Wa360dialogService } from './wa360dialog.service';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [HttpModule, ConfigModule],
  providers: [Wa360dialogService],
  exports: [Wa360dialogService],
})
export class Wa360dialogModule {}

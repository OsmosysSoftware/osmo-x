import { Logger, Module } from '@nestjs/common';
import { AwsSesService } from './aws-ses.service';
import { ConfigModule } from '@nestjs/config';
import { ProvidersModule } from '../providers.module';
import { ProvidersService } from '../providers.service';

@Module({
  imports: [ConfigModule, ProvidersModule],
  providers: [AwsSesService, ProvidersService, Logger],
  exports: [AwsSesService],
})
export class AwsSesModule {}

import { Logger, Module } from '@nestjs/common';
import { AwsSesService } from './aws-ses.service';
import { ConfigModule } from '@nestjs/config';
import { ProvidersModule } from '../providers.module';

@Module({
  imports: [ConfigModule, ProvidersModule],
  providers: [AwsSesService, Logger],
  exports: [AwsSesService],
})
export class AwsSesModule {}

import { Module } from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import { ApplicationsResolver } from './applications.resolver';

@Module({
  providers: [ApplicationsResolver, ApplicationsService],
})
export class ApplicationsModule {}

import { Module } from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import { ApplicationsResolver } from './applications.resolver';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Application } from './entities/application.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Application])],
  providers: [ApplicationsResolver, ApplicationsService],
  exports: [TypeOrmModule],
})
export class ApplicationsModule {}

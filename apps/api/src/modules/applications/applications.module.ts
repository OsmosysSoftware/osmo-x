import { Module } from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Application } from './entities/application.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Application])],
  providers: [ApplicationsService],
  exports: [TypeOrmModule],
})
export class ApplicationsModule {}

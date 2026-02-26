import { Module } from '@nestjs/common';
import { MasterProvidersService } from './master-providers.service';
import { MasterProvidersV1Controller } from './master-providers-v1.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MasterProvider } from './entities/master-provider.entity';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [TypeOrmModule.forFeature([MasterProvider]), JwtModule],
  providers: [MasterProvidersService],
  controllers: [MasterProvidersV1Controller],
  exports: [TypeOrmModule, MasterProvidersService],
})
export class MasterProvidersModule {}

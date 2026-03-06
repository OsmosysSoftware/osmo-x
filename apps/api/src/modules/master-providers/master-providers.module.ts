import { Module } from '@nestjs/common';
import { MasterProvidersService } from './master-providers.service';
import { MasterProvidersController } from './master-providers.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MasterProvider } from './entities/master-provider.entity';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [TypeOrmModule.forFeature([MasterProvider]), JwtModule],
  providers: [MasterProvidersService],
  controllers: [MasterProvidersController],
  exports: [TypeOrmModule, MasterProvidersService],
})
export class MasterProvidersModule {}

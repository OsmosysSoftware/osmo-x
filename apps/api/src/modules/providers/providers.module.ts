import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JsendFormatter } from 'src/common/jsend-formatter';
import { Provider } from './entities/provider.entity';
import { ProvidersService } from './providers.service';

@Module({
  imports: [TypeOrmModule.forFeature([Provider])],
  providers: [ProvidersService, JsendFormatter],
  exports: [TypeOrmModule],
})
export class ProvidersModule {}

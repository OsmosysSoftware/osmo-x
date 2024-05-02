import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JsendFormatter } from 'src/common/jsend-formatter';
import { Provider } from './entities/provider.entity';
import { ProvidersService } from './providers.service';
import { IsDataValidConstraint } from 'src/common/decorators/is-data-valid.decorator';

@Module({
  imports: [TypeOrmModule.forFeature([Provider])],
  providers: [ProvidersService, JsendFormatter, IsDataValidConstraint],
  exports: [TypeOrmModule],
})
export class ProvidersModule {}

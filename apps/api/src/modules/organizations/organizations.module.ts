import { Logger, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Organization } from './entities/organization.entity';
import { OrganizationsService } from './organizations.service';
import { JsendFormatter } from 'src/common/jsend-formatter';

@Module({
  imports: [TypeOrmModule.forFeature([Organization])],
  providers: [OrganizationsService, JsendFormatter, Logger],
  exports: [TypeOrmModule, OrganizationsService],
})
export class OrganizationsModule {}

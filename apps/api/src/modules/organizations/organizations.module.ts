import { Logger, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Organization } from './entities/organization.entity';
import { OrganizationsService } from './organizations.service';
import { OrganizationsController } from './organizations.controller';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [TypeOrmModule.forFeature([Organization]), JwtModule],
  providers: [OrganizationsService, Logger],
  controllers: [OrganizationsController],
  exports: [TypeOrmModule, OrganizationsService],
})
export class OrganizationsModule {}

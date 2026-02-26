import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { OrganizationsService } from './organizations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/role.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRoles } from 'src/common/constants/database';
import { Organization } from './entities/organization.entity';

@ApiTags('Organizations')
@ApiBearerAuth()
@Controller('api/v1/organizations')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRoles.SUPER_ADMIN)
export class OrganizationsV1Controller {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Get()
  @ApiOperation({ summary: 'List all organizations' })
  @ApiResponse({ status: 200, description: 'List of all organizations' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Super Admin only' })
  async findAll(): Promise<Organization[]> {
    return this.organizationsService.findAll();
  }
}

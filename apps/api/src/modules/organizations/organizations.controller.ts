import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiExtraModels, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { OrganizationsService } from './organizations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/role.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRoles } from 'src/common/constants/database';
import { OrganizationResponseDto } from './dto/organization-response.dto';

@ApiTags('Organizations')
@ApiBearerAuth()
@ApiExtraModels(OrganizationResponseDto)
@Controller('api/v1/organizations')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRoles.SUPER_ADMIN)
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Get()
  @ApiOperation({ summary: 'List all organizations' })
  @ApiResponse({
    status: 200,
    description: 'List of all organizations',
    type: [OrganizationResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Super Admin only' })
  async findAll(): Promise<OrganizationResponseDto[]> {
    return this.organizationsService.findAllAsDto();
  }
}

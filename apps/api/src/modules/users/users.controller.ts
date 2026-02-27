import { Controller, Get, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiExtraModels, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/role.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRoles } from 'src/common/constants/database';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from 'src/common/constants/jwtInterface';
import { UserResponseDto } from './dto/user-response.dto';
import { SnakeCaseInterceptor } from 'src/common/interceptors/snake-case.interceptor';

@ApiTags('Users')
@ApiBearerAuth()
@ApiExtraModels(UserResponseDto)
@Controller('api/v1/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(SnakeCaseInterceptor)
@Roles(UserRoles.ORG_ADMIN)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'List all users in the organization' })
  @ApiResponse({
    status: 200,
    description: 'List of users in the organization',
    type: [UserResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(@CurrentUser() user: JwtPayload): Promise<UserResponseDto[]> {
    return this.usersService.findByOrganizationIdAsDto(user.organizationId);
  }
}

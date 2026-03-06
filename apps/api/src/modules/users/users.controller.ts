import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Put,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiExtraModels,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/role.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRoles } from 'src/common/constants/database';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from 'src/common/constants/jwtInterface';
import { UserResponseDto } from './dto/user-response.dto';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';
import { UpdateProfileInput } from './dto/update-profile.input';
import { ChangePasswordInput } from './dto/change-password.input';
import { SnakeCaseInterceptor } from 'src/common/interceptors/snake-case.interceptor';
import { resolveOrgId } from 'src/common/utils/org-resolver.helper';

@ApiTags('Users')
@ApiBearerAuth()
@ApiExtraModels(UserResponseDto)
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(SnakeCaseInterceptor)
@Roles(UserRoles.ORG_ADMIN)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Put('profile')
  @Roles(UserRoles.ORG_USER)
  @ApiOperation({ summary: 'Update own profile' })
  @ApiResponse({ status: 200, description: 'Profile updated', type: UserResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateProfile(
    @Body() input: UpdateProfileInput,
    @CurrentUser() user: JwtPayload,
  ): Promise<UserResponseDto> {
    return this.usersService.updateProfile(user.userId, input);
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRoles.ORG_USER)
  @ApiOperation({ summary: 'Change own password' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Current password is incorrect' })
  async changePassword(
    @Body() input: ChangePasswordInput,
    @CurrentUser() user: JwtPayload,
  ): Promise<{ message: string }> {
    await this.usersService.changePassword(user.userId, input);

    return { message: 'Password changed successfully' };
  }

  @Get()
  @ApiOperation({ summary: 'List users' })
  @ApiQuery({
    name: 'organization_id',
    required: false,
    type: Number,
    description: 'Target org (SUPER_ADMIN only)',
  })
  @ApiResponse({
    status: 200,
    description: 'List of users in the organization',
    type: [UserResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(
    @CurrentUser() user: JwtPayload,
    @Query('organization_id') queryOrgId?: number,
  ): Promise<UserResponseDto[]> {
    const targetOrgId = resolveOrgId(user, queryOrgId);

    return this.usersService.findByOrganizationIdAsDto(targetOrgId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({
    status: 201,
    description: 'User created successfully',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(
    @Body() createUserInput: CreateUserInput,
    @CurrentUser() user: JwtPayload,
  ): Promise<UserResponseDto> {
    const targetOrgId = resolveOrgId(user, createUserInput.organizationId);

    return this.usersService.createUserAsDto(createUserInput, targetOrgId, user.userId);
  }

  @Put()
  @ApiOperation({ summary: 'Update an existing user' })
  @ApiResponse({ status: 200, description: 'User updated', type: UserResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async update(
    @Body() updateUserInput: UpdateUserInput,
    @Body('organizationId') orgId: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<UserResponseDto> {
    const targetOrgId = resolveOrgId(user, orgId);

    return this.usersService.updateUserAsDto(updateUserInput, targetOrgId, user.userId);
  }

  @Delete()
  @ApiOperation({ summary: 'Deactivate a user' })
  @ApiResponse({ status: 200, description: 'User deactivated' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async remove(
    @Body('userId') userId: number,
    @Body('organizationId') orgId: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<boolean> {
    const targetOrgId = resolveOrgId(user, orgId);

    return this.usersService.softDeleteUserAsDto(userId, targetOrgId);
  }
}

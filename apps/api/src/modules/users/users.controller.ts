import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Put,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiExtraModels, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
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
  @ApiOperation({ summary: 'List users (SUPER_ADMIN can query any org via ?organizationId=)' })
  @ApiResponse({
    status: 200,
    description: 'List of users in the organization',
    type: [UserResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(
    @CurrentUser() user: JwtPayload,
    @Query('organizationId') queryOrgId?: number,
  ): Promise<UserResponseDto[]> {
    const targetOrgId = this.resolveOrgId(user, queryOrgId);

    return this.usersService.findByOrganizationIdAsDto(targetOrgId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new user (SUPER_ADMIN can target any org)' })
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
    const targetOrgId = this.resolveOrgId(user, createUserInput.organizationId);

    return this.usersService.createUserAsDto(createUserInput, targetOrgId, user.userId);
  }

  private resolveOrgId(user: JwtPayload, requestedOrgId?: number): number {
    if (requestedOrgId && requestedOrgId !== user.organizationId) {
      if (user.role !== UserRoles.SUPER_ADMIN) {
        throw new BadRequestException('Only SUPER_ADMIN can target other organizations');
      }

      return requestedOrgId;
    }

    return user.organizationId;
  }

  @Put()
  @ApiOperation({ summary: 'Update an existing user' })
  @ApiResponse({ status: 200, description: 'User updated', type: UserResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async update(
    @Body() updateUserInput: UpdateUserInput,
    @CurrentUser() user: JwtPayload,
  ): Promise<UserResponseDto> {
    return this.usersService.updateUserAsDto(updateUserInput, user.organizationId, user.userId);
  }

  @Delete()
  @ApiOperation({ summary: 'Deactivate a user' })
  @ApiResponse({ status: 200, description: 'User deactivated' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async remove(@Body('userId') userId: number, @CurrentUser() user: JwtPayload): Promise<boolean> {
    return this.usersService.softDeleteUserAsDto(userId, user.organizationId);
  }
}

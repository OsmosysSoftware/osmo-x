import { Injectable } from '@nestjs/common';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Status } from 'src/common/constants/database';
import { UserResponseDto } from './dto/user-response.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findByUsername(username: string): Promise<User | undefined> {
    return this.userRepository.findOne({ where: { username, status: Status.ACTIVE } });
  }

  async findByUserId(userId: number): Promise<User | undefined> {
    return this.userRepository.findOne({ where: { userId, status: Status.ACTIVE } });
  }

  async findByOrganizationId(organizationId: number): Promise<User[]> {
    return this.userRepository.find({
      where: { organizationId, status: Status.ACTIVE },
    });
  }

  private mapToDto(user: User): UserResponseDto {
    return {
      userId: user.userId,
      username: user.username,
      email: user.email,
      userRole: user.userRole,
      organizationId: user.organizationId,
      status: user.status,
      createdBy: user.createdBy,
      updatedBy: user.updatedBy,
      createdOn: user.createdOn,
      updatedOn: user.updatedOn,
    };
  }

  async findByOrganizationIdAsDto(organizationId: number): Promise<UserResponseDto[]> {
    const users = await this.findByOrganizationId(organizationId);

    return users.map((user) => this.mapToDto(user));
  }
}

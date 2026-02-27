import { BadRequestException, Injectable } from '@nestjs/common';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Status } from 'src/common/constants/database';
import { UserResponseDto } from './dto/user-response.dto';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';
import { encodePassword } from 'src/common/utils/bcrypt';

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

  async createUserAsDto(
    input: CreateUserInput,
    organizationId: number,
    createdByUserId: number,
  ): Promise<UserResponseDto> {
    const existing = await this.userRepository.findOne({
      where: { username: input.username },
    });

    if (existing) {
      throw new BadRequestException('Username already exists');
    }

    const hashedPassword = encodePassword(input.password);

    const user = this.userRepository.create({
      username: input.username,
      password: hashedPassword,
      email: input.email,
      userRole: input.userRole,
      organizationId,
      createdBy: createdByUserId,
      updatedBy: createdByUserId,
    });

    const saved = await this.userRepository.save(user);

    return this.mapToDto(saved);
  }

  async updateUserAsDto(
    input: UpdateUserInput,
    organizationId: number,
    updatedByUserId: number,
  ): Promise<UserResponseDto> {
    const user = await this.userRepository.findOne({
      where: { userId: input.userId, organizationId, status: Status.ACTIVE },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (input.username !== undefined) {
      const existing = await this.userRepository.findOne({
        where: { username: input.username },
      });

      if (existing && existing.userId !== input.userId) {
        throw new BadRequestException('Username already exists');
      }

      user.username = input.username;
    }

    if (input.password !== undefined) {
      user.password = encodePassword(input.password);
    }

    if (input.email !== undefined) {
      user.email = input.email;
    }

    if (input.userRole !== undefined) {
      user.userRole = input.userRole;
    }

    user.updatedBy = updatedByUserId;

    const saved = await this.userRepository.save(user);

    return this.mapToDto(saved);
  }

  async softDeleteUserAsDto(userId: number, organizationId: number): Promise<boolean> {
    const user = await this.userRepository.findOne({
      where: { userId, organizationId, status: Status.ACTIVE },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    user.status = Status.INACTIVE;
    await this.userRepository.save(user);

    return true;
  }
}

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    try {
      // Check if email already exists
      const existingUserByEmail = await this.userRepository.findOne({
        where: { email: createUserDto.email },
      });

      if (existingUserByEmail) {
        throw new ConflictException(
          `User with email ${createUserDto.email} already exists`,
        );
      }

      // Hash password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(
        createUserDto.password,
        saltRounds,
      );

      const user = this.userRepository.create({
        ...createUserDto,
        password: hashedPassword,
      });

      const savedUser = await this.userRepository.save(user);
      return this.findOne(savedUser.id);
    } catch (error) {
      if (
        error instanceof ConflictException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException(`Failed to create user: ${error.message}`);
    }
  }

  async findAll(): Promise<User[]> {
    return await this.userRepository.find({
      order: { created_at: 'DESC' },
      select: {
        id: true,
        email: true,
        full_name: true,
        phone_number: true,
        role: true,
        is_active: true,
        email_verified: true,
        last_login: true,
        created_at: true,
        updated_at: true,
      },
    });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      select: {
        id: true,
        email: true,
        full_name: true,
        phone_number: true,
        role: true,
        is_active: true,
        email_verified: true,
        last_login: true,
        created_at: true,
        updated_at: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { email },
    });
  }

  async findByPhoneNumber(phone_number: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { phone_number },
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Check if email is being updated and if it conflicts with another user
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.userRepository.findOne({
        where: { email: updateUserDto.email },
      });

      if (existingUser) {
        throw new ConflictException(
          `User with email ${updateUserDto.email} already exists`,
        );
      }
    }

    // Check if phone number is being updated and if it conflicts with another user
    if (
      updateUserDto.phone_number &&
      updateUserDto.phone_number !== user.phone_number
    ) {
      const existingUser = await this.userRepository.findOne({
        where: { phone_number: updateUserDto.phone_number },
      });

      if (existingUser) {
        throw new ConflictException(
          `User with phone number ${updateUserDto.phone_number} already exists`,
        );
      }
    }

    // Hash password if it's being updated
    if (updateUserDto.password) {
      const saltRounds = 10;
      updateUserDto.password = await bcrypt.hash(
        updateUserDto.password,
        saltRounds,
      );
    }

    // Update user fields
    Object.assign(user, updateUserDto);

    try {
      await this.userRepository.save(user);
      return this.findOne(id);
    } catch (error) {
      throw new BadRequestException(`Failed to update user: ${error.message}`);
    }
  }

  async remove(id: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    await this.userRepository.remove(user);
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.userRepository.update(id, {
      last_login: new Date(),
    });
  }
}


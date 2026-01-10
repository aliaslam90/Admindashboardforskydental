import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Service } from './entities/service.entity';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { User, UserRole } from '../users/entities/user.entity';

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  private async checkRolePermission(userId?: string, allowedRoles: UserRole[] = [UserRole.ADMIN]): Promise<void> {
    if (!userId) {
      // If no userId provided, allow (for backward compatibility)
      // In production, you should require authentication
      return;
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new ForbiddenException('User not found');
    }

    if (!allowedRoles.includes(user.role)) {
      throw new ForbiddenException('You do not have permission to perform this action');
    }
  }

  async create(createServiceDto: CreateServiceDto, userId?: string): Promise<Service> {
    // Only admin and appointment-manager can create services
    await this.checkRolePermission(userId, [UserRole.ADMIN]);
    
    try {
      const service = this.serviceRepository.create({
        ...createServiceDto,
        active_status: createServiceDto.active_status ?? true,
        created_by: userId,
      });
      return await this.serviceRepository.save(service);
    } catch (error) {
      throw new BadRequestException('Failed to create service');
    }
  }

  async findAll(): Promise<Service[]> {
    return await this.serviceRepository.find({
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Service> {
    const service = await this.serviceRepository.findOne({ where: { id } });
    if (!service) {
      throw new NotFoundException(`Service with ID ${id} not found`);
    }
    return service;
  }

  async update(id: number, updateServiceDto: UpdateServiceDto, userId?: string): Promise<Service> {
    // Admin and Manager can update services
    // Receptionist cannot update services
    await this.checkRolePermission(userId, [UserRole.ADMIN, UserRole.MANAGER]);
    
    const service = await this.findOne(id);
    
    // Log who updated the service
    Object.assign(service, {
      ...updateServiceDto,
      updated_by: userId, // This logs who made the update
    });
    
    try {
      return await this.serviceRepository.save(service);
    } catch (error) {
      throw new BadRequestException('Failed to update service');
    }
  }

  async remove(id: number): Promise<void> {
    const service = await this.findOne(id);
    await this.serviceRepository.remove(service);
  }
}

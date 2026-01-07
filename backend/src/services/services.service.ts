import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Service } from './entities/service.entity';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
  ) {}

  async create(createServiceDto: CreateServiceDto): Promise<Service> {
    try {
      const service = this.serviceRepository.create({
        ...createServiceDto,
        active_status: createServiceDto.active_status ?? true,
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

  async update(id: number, updateServiceDto: UpdateServiceDto): Promise<Service> {
    const service = await this.findOne(id);
    
    Object.assign(service, updateServiceDto);
    
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

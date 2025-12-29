import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Doctor, DoctorStatus } from './entities/doctor.entity';
import { DoctorLeave } from './entities/doctor-leave.entity';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';
import { CreateDoctorLeaveDto } from './dto/create-doctor-leave.dto';
import { UpdateDoctorLeaveDto } from './dto/update-doctor-leave.dto';
import { Service } from '../services/entities/service.entity';

@Injectable()
export class DoctorsService {
  constructor(
    @InjectRepository(Doctor)
    private readonly doctorRepository: Repository<Doctor>,
    @InjectRepository(DoctorLeave)
    private readonly doctorLeaveRepository: Repository<DoctorLeave>,
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
  ) {}

  async create(createDoctorDto: CreateDoctorDto): Promise<Doctor> {
    try {
      const doctor = this.doctorRepository.create({
        name: createDoctorDto.name,
        specialization: createDoctorDto.specialization,
        status: createDoctorDto.status || DoctorStatus.ACTIVE,
        services_offered: createDoctorDto.services_offered || [],
        working_hours: createDoctorDto.working_hours || {},
      });

      const savedDoctor = await this.doctorRepository.save(doctor);

      // Create leave dates if provided
      if (createDoctorDto.leave_dates && createDoctorDto.leave_dates.length > 0) {
        const leaves = createDoctorDto.leave_dates.map((leaveDto) =>
          this.doctorLeaveRepository.create({
            doctor_id: savedDoctor.id,
            leave_date: new Date(leaveDto.leave_date),
            reason: leaveDto.reason,
          }),
        );
        await this.doctorLeaveRepository.save(leaves);
      }

      // Reload doctor with relations
      return this.findOne(savedDoctor.id);
    } catch (error) {
      throw new BadRequestException(`Failed to create doctor: ${error.message}`);
    }
  }

  async findAll(): Promise<Doctor[]> {
    return await this.doctorRepository.find({
      relations: ['leave_dates'],
      order: { created_at: 'DESC' },
    });
  }

  async findAllServices(): Promise<Service[]> {
    return this.serviceRepository.find({
      order: { name: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Doctor> {
    const doctor = await this.doctorRepository.findOne({
      where: { id },
      relations: ['leave_dates'],
    });

    if (!doctor) {
      throw new NotFoundException(`Doctor with ID ${id} not found`);
    }

    return doctor;
  }

  async update(id: number, updateDoctorDto: UpdateDoctorDto): Promise<Doctor> {
    const doctor = await this.findOne(id);

    // Update doctor fields
    if (updateDoctorDto.name !== undefined) {
      doctor.name = updateDoctorDto.name;
    }
    if (updateDoctorDto.specialization !== undefined) {
      doctor.specialization = updateDoctorDto.specialization;
    }
    if (updateDoctorDto.services_offered !== undefined) {
      doctor.services_offered = updateDoctorDto.services_offered;
    }
    if (updateDoctorDto.working_hours !== undefined) {
      doctor.working_hours = updateDoctorDto.working_hours;
    }
    if (updateDoctorDto.status !== undefined) {
      doctor.status = updateDoctorDto.status;
    }

    try {
      await this.doctorRepository.save(doctor);

      // Update leave dates if provided
      if (updateDoctorDto.leave_dates !== undefined) {
        // Remove existing leaves
        await this.doctorLeaveRepository.delete({ doctor_id: id });

        // Create new leaves
        if (updateDoctorDto.leave_dates.length > 0) {
          const leaves = updateDoctorDto.leave_dates.map((leaveDto) =>
            this.doctorLeaveRepository.create({
              doctor_id: id,
              leave_date: new Date(leaveDto.leave_date),
              reason: leaveDto.reason,
            }),
          );
          await this.doctorLeaveRepository.save(leaves);
        }
      }

      // Reload doctor with relations
      return this.findOne(id);
    } catch (error) {
      throw new BadRequestException(`Failed to update doctor: ${error.message}`);
    }
  }

  async remove(id: number): Promise<void> {
    const doctor = await this.findOne(id);
    await this.doctorRepository.remove(doctor);
  }

  // Additional method to manage leave dates separately
  async addLeaveDate(doctorId: number, leaveDto: CreateDoctorLeaveDto): Promise<DoctorLeave> {
    const doctor = await this.findOne(doctorId);

    const leave = this.doctorLeaveRepository.create({
      doctor_id: doctorId,
      leave_date: new Date(leaveDto.leave_date),
      reason: leaveDto.reason,
    });

    return await this.doctorLeaveRepository.save(leave);
  }

  async removeLeaveDate(leaveId: number): Promise<void> {
    const leave = await this.doctorLeaveRepository.findOne({ where: { id: leaveId } });
    if (!leave) {
      throw new NotFoundException(`Leave date with ID ${leaveId} not found`);
    }
    await this.doctorLeaveRepository.remove(leave);
  }

  async updateLeaveDate(
    leaveId: number,
    updateDto: UpdateDoctorLeaveDto,
  ): Promise<DoctorLeave> {
    const leave = await this.doctorLeaveRepository.findOne({ where: { id: leaveId } });
    if (!leave) {
      throw new NotFoundException(`Leave date with ID ${leaveId} not found`);
    }

    if (updateDto.leave_date !== undefined) {
      leave.leave_date = new Date(updateDto.leave_date);
    }
    if (updateDto.reason !== undefined) {
      leave.reason = updateDto.reason;
    }

    try {
      return await this.doctorLeaveRepository.save(leave);
    } catch (error) {
      throw new BadRequestException(`Failed to update leave date: ${error.message}`);
    }
  }
}

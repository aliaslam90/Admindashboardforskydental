import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment } from './entities/appointment.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { Patient } from '../patients/entities/patient.entity';
import { Doctor } from '../doctors/entities/doctor.entity';
import { Service } from '../services/entities/service.entity';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>,
    @InjectRepository(Doctor)
    private readonly doctorRepository: Repository<Doctor>,
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
  ) {}

  async create(createAppointmentDto: CreateAppointmentDto): Promise<Appointment> {
    // Validate that patient exists
    const patient = await this.patientRepository.findOne({
      where: { id: createAppointmentDto.patient_id },
    });
    if (!patient) {
      throw new NotFoundException(
        `Patient with ID ${createAppointmentDto.patient_id} not found`,
      );
    }

    // Validate that doctor exists
    const doctor = await this.doctorRepository.findOne({
      where: { id: createAppointmentDto.doctor_id },
    });
    if (!doctor) {
      throw new NotFoundException(
        `Doctor with ID ${createAppointmentDto.doctor_id} not found`,
      );
    }

    // Validate that service exists
    const service = await this.serviceRepository.findOne({
      where: { id: createAppointmentDto.service_id },
    });
    if (!service) {
      throw new NotFoundException(
        `Service with ID ${createAppointmentDto.service_id} not found`,
      );
    }

    // Validate datetime logic
    const startDate = new Date(createAppointmentDto.start_datetime);
    const endDate = new Date(createAppointmentDto.end_datetime);

    if (endDate <= startDate) {
      throw new BadRequestException(
        'end_datetime must be after start_datetime',
      );
    }

    try {
      const appointment = this.appointmentRepository.create({
        ...createAppointmentDto,
        start_datetime: startDate,
        end_datetime: endDate,
      });

      return await this.appointmentRepository.save(appointment);
    } catch (error) {
      throw new BadRequestException(
        `Failed to create appointment: ${error.message}`,
      );
    }
  }

  async findAll(): Promise<Appointment[]> {
    return await this.appointmentRepository.find({
      relations: ['patient', 'doctor', 'service'],
      order: { start_datetime: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Appointment> {
    const appointment = await this.appointmentRepository.findOne({
      where: { id },
      relations: ['patient', 'doctor', 'service'],
    });

    if (!appointment) {
      throw new NotFoundException(`Appointment with ID ${id} not found`);
    }

    return appointment;
  }

  async update(
    id: string,
    updateAppointmentDto: UpdateAppointmentDto,
  ): Promise<Appointment> {
    const appointment = await this.findOne(id);

    // Validate foreign keys if they're being updated
    if (updateAppointmentDto.patient_id) {
      const patient = await this.patientRepository.findOne({
        where: { id: updateAppointmentDto.patient_id },
      });
      if (!patient) {
        throw new NotFoundException(
          `Patient with ID ${updateAppointmentDto.patient_id} not found`,
        );
      }
    }

    if (updateAppointmentDto.doctor_id) {
      const doctor = await this.doctorRepository.findOne({
        where: { id: updateAppointmentDto.doctor_id },
      });
      if (!doctor) {
        throw new NotFoundException(
          `Doctor with ID ${updateAppointmentDto.doctor_id} not found`,
        );
      }
    }

    if (updateAppointmentDto.service_id) {
      const service = await this.serviceRepository.findOne({
        where: { id: updateAppointmentDto.service_id },
      });
      if (!service) {
        throw new NotFoundException(
          `Service with ID ${updateAppointmentDto.service_id} not found`,
        );
      }
    }

    // Validate datetime logic if dates are being updated
    const startDate = updateAppointmentDto.start_datetime
      ? new Date(updateAppointmentDto.start_datetime)
      : appointment.start_datetime;
    const endDate = updateAppointmentDto.end_datetime
      ? new Date(updateAppointmentDto.end_datetime)
      : appointment.end_datetime;

    if (endDate <= startDate) {
      throw new BadRequestException(
        'end_datetime must be after start_datetime',
      );
    }

    // Update appointment fields
    Object.assign(appointment, {
      ...updateAppointmentDto,
      start_datetime: updateAppointmentDto.start_datetime
        ? new Date(updateAppointmentDto.start_datetime)
        : appointment.start_datetime,
      end_datetime: updateAppointmentDto.end_datetime
        ? new Date(updateAppointmentDto.end_datetime)
        : appointment.end_datetime,
    });

    try {
      await this.appointmentRepository.save(appointment);
      return this.findOne(id);
    } catch (error) {
      throw new BadRequestException(
        `Failed to update appointment: ${error.message}`,
      );
    }
  }

  async remove(id: string): Promise<void> {
    const appointment = await this.findOne(id);
    await this.appointmentRepository.remove(appointment);
  }
}


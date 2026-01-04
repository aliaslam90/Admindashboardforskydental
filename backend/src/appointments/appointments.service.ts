import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Like } from 'typeorm';
import { Appointment, AppointmentStatus } from './entities/appointment.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { CreateAppointmentWithPatientDto } from './dto/create-appointment-with-patient.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { Patient } from '../patients/entities/patient.entity';
import { Doctor } from '../doctors/entities/doctor.entity';
import { Service } from '../services/entities/service.entity';

export interface AppointmentFilters {
  search?: string;
  doctorId?: number;
  serviceId?: number;
  status?: AppointmentStatus;
  dateFrom?: string;
  dateTo?: string;
  patientId?: string;
}

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

  private async ensureNoOverlap(params: {
    doctorId: number;
    start: Date;
    end: Date;
    excludeAppointmentId?: string;
  }) {
    const { doctorId, start, end, excludeAppointmentId } = params;

    const qb = this.appointmentRepository
      .createQueryBuilder('appointment')
      .where('appointment.doctor_id = :doctorId', { doctorId })
      .andWhere('appointment.start_datetime < :end', { end })
      .andWhere('appointment.end_datetime > :start', { start })
      .andWhere('appointment.status != :cancelled', {
        cancelled: AppointmentStatus.CANCELLED,
      });

    if (excludeAppointmentId) {
      qb.andWhere('appointment.id != :excludeId', {
        excludeId: excludeAppointmentId,
      });
    }

    const conflict = await qb.getOne();
    if (conflict) {
      throw new BadRequestException(
        'Doctor already has an appointment during this time range',
      );
    }
  }

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

    // Compute end time based on service duration to avoid client-side overlap errors
    const startDate = new Date(createAppointmentDto.start_datetime);
    const endDate = new Date(
      startDate.getTime() + (service.duration_minutes ?? 0) * 60 * 1000,
    );

    if (endDate <= startDate) {
      throw new BadRequestException(
        'end_datetime must be after start_datetime',
      );
    }

    await this.ensureNoOverlap({
      doctorId: doctor.id,
      start: startDate,
      end: endDate,
    });

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

  async createWithPatient(
    createDto: CreateAppointmentWithPatientDto,
  ): Promise<Appointment> {
    // Find or create patient
    let patient: Patient | null;

    if (createDto.patient.id) {
      // Use existing patient
      patient = await this.patientRepository.findOne({
        where: { id: createDto.patient.id },
      });
      if (!patient) {
        throw new NotFoundException(
          `Patient with ID ${createDto.patient.id} not found`,
        );
      }
    } else {
      // Check if patient exists by phone
      patient = await this.patientRepository.findOne({
        where: { phone_number: createDto.patient.phone_number },
      });

      if (!patient) {
        // Create new patient
        const newPatient = this.patientRepository.create({
          full_name: createDto.patient.full_name,
          phone_number: createDto.patient.phone_number,
          email: createDto.patient.email || '',
        });
        patient = await this.patientRepository.save(newPatient);
      }
    }

    // Safety check (should never happen but keeps TS satisfied)
    if (!patient) {
      throw new NotFoundException('Patient could not be created or found');
    }

    // Now create the appointment with the patient_id
    const appointmentDto: CreateAppointmentDto = {
      patient_id: patient.id,
      doctor_id: createDto.doctor_id,
      service_id: createDto.service_id,
      start_datetime: createDto.start_datetime,
      end_datetime: createDto.end_datetime,
      status: createDto.status,
      notes: createDto.notes,
    };

    return this.create(appointmentDto);
  }

  async findAll(filters?: AppointmentFilters): Promise<Appointment[]> {
    const queryBuilder = this.appointmentRepository
      .createQueryBuilder('appointment')
      .leftJoinAndSelect('appointment.patient', 'patient')
      .leftJoinAndSelect('appointment.doctor', 'doctor')
      .leftJoinAndSelect('appointment.service', 'service');

    // Apply filters
    if (filters?.doctorId) {
      queryBuilder.andWhere('appointment.doctor_id = :doctorId', {
        doctorId: filters.doctorId,
      });
    }

    if (filters?.serviceId) {
      queryBuilder.andWhere('appointment.service_id = :serviceId', {
        serviceId: filters.serviceId,
      });
    }

    if (filters?.status) {
      queryBuilder.andWhere('appointment.status = :status', {
        status: filters.status,
      });
    }

    if (filters?.patientId) {
      queryBuilder.andWhere('appointment.patient_id = :patientId', {
        patientId: filters.patientId,
      });
    }

    if (filters?.dateFrom) {
      queryBuilder.andWhere('appointment.start_datetime >= :dateFrom', {
        dateFrom: new Date(filters.dateFrom),
      });
    }

    if (filters?.dateTo) {
      // Add 1 day to include the entire end date
      const endDate = new Date(filters.dateTo);
      endDate.setDate(endDate.getDate() + 1);
      queryBuilder.andWhere('appointment.start_datetime < :dateTo', {
        dateTo: endDate,
      });
    }

    if (filters?.search) {
      queryBuilder.andWhere(
        '(patient.full_name ILIKE :search OR patient.phone_number ILIKE :search OR appointment.id::text ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    queryBuilder.orderBy('appointment.start_datetime', 'DESC');

    return await queryBuilder.getMany();
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

    await this.ensureNoOverlap({
      doctorId: updateAppointmentDto.doctor_id || appointment.doctor_id,
      start: startDate,
      end: endDate,
      excludeAppointmentId: id,
    });

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

  async updateStatus(
    id: string,
    status: AppointmentStatus,
  ): Promise<Appointment> {
    const appointment = await this.findOne(id);
    appointment.status = status;

    try {
      await this.appointmentRepository.save(appointment);
      return this.findOne(id);
    } catch (error) {
      throw new BadRequestException(
        `Failed to update appointment status: ${error.message}`,
      );
    }
  }

  async remove(id: string): Promise<void> {
    const appointment = await this.findOne(id);
    await this.appointmentRepository.remove(appointment);
  }
}


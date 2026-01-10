import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Like, Not } from 'typeorm';
import { Appointment, AppointmentStatus } from './entities/appointment.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { CreateAppointmentWithPatientDto } from './dto/create-appointment-with-patient.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { Patient } from '../patients/entities/patient.entity';
import { Doctor } from '../doctors/entities/doctor.entity';
import { Service } from '../services/entities/service.entity';
import { SettingsService } from '../settings/settings.service';
import { AppointmentSettings } from '../settings/entities/appointment-settings.entity';
import { User, UserRole } from '../users/entities/user.entity';

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
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly settingsService: SettingsService,
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

  private async ensureNoOverlap(params: {
    doctorId: number;
    start: Date;
    end: Date;
    bufferMinutes: number;
    excludeAppointmentId?: string;
  }) {
    const { doctorId, start, end, bufferMinutes, excludeAppointmentId } = params;

    const bufferedStart = new Date(start.getTime() - bufferMinutes * 60 * 1000);
    const bufferedEnd = new Date(end.getTime() + bufferMinutes * 60 * 1000);

    const qb = this.appointmentRepository
      .createQueryBuilder('appointment')
      .where('appointment.doctor_id = :doctorId', { doctorId })
      .andWhere('appointment.start_datetime < :end', { end: bufferedEnd })
      .andWhere('appointment.end_datetime > :start', { start: bufferedStart })
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
        'Doctor already has an appointment during this time range (includes buffer)',
      );
    }
  }

  private async getSettings(): Promise<AppointmentSettings> {
    return this.settingsService.getAppointmentSettings();
  }

  /**
   * Compute available slots for a doctor & service based on:
   * - Global appointment settings (working days, buffer)
   * - Doctor-specific working_hours (supports multiple ranges per day / breaks)
   * - Existing non-cancelled appointments
   *
   * This is used by the admin UI to only allow booking valid slots.
   */
  async getAvailability(params: {
    doctorId: number;
    serviceId: number;
    from?: string;
    days?: number;
  }): Promise<
    {
      start: string;
      end: string;
    }[]
  > {
    const { doctorId, serviceId } = params;
    const days = params.days ?? 30; // 1 month booking window
    // Always start from today (ignore 'from' parameter to ensure 1-month booking window)
    const today = new Date();
    const from = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    const settings = await this.getSettings();

    // Ensure doctor & service exist
    const doctor = await this.doctorRepository.findOne({
      where: { id: doctorId },
    });
    if (!doctor) {
      throw new NotFoundException(`Doctor with ID ${doctorId} not found`);
    }

    const service = await this.serviceRepository.findOne({
      where: { id: serviceId },
    });
    if (!service) {
      throw new NotFoundException(`Service with ID ${serviceId} not found`);
    }

    const durationMinutes = service.duration_minutes ?? 0;
    if (durationMinutes <= 0) {
      throw new BadRequestException(
        'Service duration must be greater than 0 minutes',
      );
    }

    // Calculate search window: from today (midnight) to exactly 30 days (1 month) in the future
    // Use local time to match working hours
    const searchStart = new Date(
      from.getFullYear(),
      from.getMonth(),
      from.getDate(),
      0,
      0,
      0,
    );
    const searchEnd = new Date(
      searchStart.getTime() + (days - 1) * 24 * 60 * 60 * 1000,
    );
    // Set to end of the last day (23:59:59.999) in local time
    searchEnd.setHours(23, 59, 59, 999);

    // Load existing appointments for the doctor in the search window
    const existing = await this.appointmentRepository.find({
      where: {
        doctor: { id: doctorId },
        status: Not(AppointmentStatus.CANCELLED),
        start_datetime: Between(searchStart, searchEnd),
      },
      order: { start_datetime: 'ASC' },
    });

    const toMinutes = (time: string) => {
      const [h, m] = time.split(':').map(Number);
      return h * 60 + m;
    };
    const bufferMinutes = settings.buffer_minutes ?? 0;
    const slots: { start: string; end: string }[] = [];

    const dayNames = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];

    const currentTime = new Date();

    for (let i = 0; i < days; i++) {
      const dayDate = new Date(searchStart.getTime() + i * 24 * 60 * 60 * 1000);

      const dayName = dayNames[dayDate.getDay()];
      if (!settings.working_days.includes(dayName)) {
        continue;
      }

      const dayKey = dayName.toLowerCase();
      const dayWorkingHours: { start: string; end: string }[] =
        (doctor.working_hours?.[dayKey] as { start: string; end: string }[]) ??
        [];

      // DEBUG: Log doctor's working hours for this day
      if (doctor.name === 'Dr. Emily Rodriguez' && dayName === 'Friday') {
        console.log(`[DEBUG] Dr. Emily Rodriguez - Friday working_hours from DB:`, JSON.stringify(doctor.working_hours?.[dayKey]));
        console.log(`[DEBUG] Parsed dayWorkingHours:`, JSON.stringify(dayWorkingHours));
      }

      // If doctor has no working hours for this day, skip (do NOT use global settings)
      if (!Array.isArray(dayWorkingHours) || dayWorkingHours.length === 0) {
        continue;
      }

      // For each working range for this day (supports breaks)
      // This handles: single range (9am-5pm), multiple ranges (9am-12pm, 3pm-7pm), etc.
      for (const range of dayWorkingHours) {
        // Validate range structure
        if (!range || typeof range.start !== 'string' || typeof range.end !== 'string') {
          continue;
        }

        const rangeStartMinutes = toMinutes(range.start);
        const rangeEndMinutes = toMinutes(range.end);

        // DEBUG: Log range being processed
        if (doctor.name === 'Dr. Emily Rodriguez' && dayName === 'Friday') {
          console.log(`[DEBUG] Processing range: ${range.start} to ${range.end} (${rangeStartMinutes} to ${rangeEndMinutes} minutes)`);
        }

        // Skip invalid ranges
        if (
          isNaN(rangeStartMinutes) ||
          isNaN(rangeEndMinutes) ||
          rangeEndMinutes <= rangeStartMinutes
        ) {
          if (doctor.name === 'Dr. Emily Rodriguez' && dayName === 'Friday') {
            console.log(`[DEBUG] Skipping invalid range`);
          }
          continue;
        }

        // Generate potential slots within this doctor-specific range
        // Check every possible start time that fits within the range
        // Step by a smaller increment to ensure we don't miss any valid slots
        const stepMinutes = Math.min(durationMinutes, 15); // Step by service duration or 15min, whichever is smaller
        for (
          let minutes = rangeStartMinutes;
          minutes + durationMinutes <= rangeEndMinutes;
          minutes += stepMinutes
        ) {
          const hours = Math.floor(minutes / 60);
          const mins = minutes % 60;

          // Create date in local timezone (not UTC) to match working hours
          // Use local date components to ensure correct timezone
          const slotStart = new Date(
            dayDate.getFullYear(),
            dayDate.getMonth(),
            dayDate.getDate(),
            hours,
            mins,
          );
          const slotEnd = new Date(
            slotStart.getTime() + durationMinutes * 60 * 1000,
          );

          // CRITICAL: Verify slot end doesn't exceed the range end time
          // Convert range end to a date for comparison
          const rangeEndHours = Math.floor(rangeEndMinutes / 60);
          const rangeEndMins = rangeEndMinutes % 60;
          const rangeEndDate = new Date(
            dayDate.getFullYear(),
            dayDate.getMonth(),
            dayDate.getDate(),
            rangeEndHours,
            rangeEndMins,
          );

          // Skip if slot end exceeds the range end time
          if (slotEnd > rangeEndDate) {
            continue;
          }

          // Do not propose slots in the past
          if (slotEnd <= currentTime) {
            continue;
          }

          // Check overlap with existing appointments including buffer
          const hasConflict = existing.some((apt) => {
            const aptStart = new Date(apt.start_datetime);
            const aptEnd = new Date(apt.end_datetime);

            const bufferedStart = new Date(
              aptStart.getTime() - bufferMinutes * 60 * 1000,
            );
            const bufferedEnd = new Date(
              aptEnd.getTime() + bufferMinutes * 60 * 1000,
            );

            return slotStart < bufferedEnd && slotEnd > bufferedStart;
          });

          if (!hasConflict) {
            slots.push({
              start: slotStart.toISOString(),
              end: slotEnd.toISOString(),
            });
          }
        }
      }
    }

    return slots;
  }

  private validateWithinWorkingHours(
    start: Date,
    end: Date,
    settings: AppointmentSettings,
    doctor?: Doctor,
  ) {
    const dayNames = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];
    const dayName = dayNames[start.getUTCDay()];
    if (!settings.working_days.includes(dayName)) {
      throw new BadRequestException('Selected day is outside working days');
    }

    const toMinutes = (time: string) => {
      const [h, m] = time.split(':').map(Number);
      return h * 60 + m;
    };

    const startMinutes =
      start.getUTCHours() * 60 + start.getUTCMinutes();
    const endMinutes = end.getUTCHours() * 60 + end.getUTCMinutes();

    // If doctor has specific working_hours configured for this day,
    // ensure the appointment falls fully within one of the ranges.
    const dayKey = dayName.toLowerCase();
    const doctorDayRanges: { start: string; end: string }[] =
      (doctor?.working_hours?.[dayKey] as { start: string; end: string }[]) ??
      [];

    if (Array.isArray(doctorDayRanges) && doctorDayRanges.length > 0) {
      const withinDoctorRange = doctorDayRanges.some((range) => {
        const rangeStartMinutes = toMinutes(range.start);
        const rangeEndMinutes = toMinutes(range.end);
        if (rangeEndMinutes <= rangeStartMinutes) return false;
        return (
          startMinutes >= rangeStartMinutes && endMinutes <= rangeEndMinutes
        );
      });

      if (!withinDoctorRange) {
        throw new BadRequestException(
          'Appointment is outside doctor working hours for this day',
        );
      }
      return;
    }

    // Fallback: use global clinic opening/closing if doctor-specific hours are not set
    const openingMinutes = toMinutes(settings.opening_time);
    const closingMinutes = toMinutes(settings.closing_time);

    if (startMinutes < openingMinutes || endMinutes > closingMinutes) {
      throw new BadRequestException('Appointment is outside working hours');
    }
  }

  async create(createAppointmentDto: CreateAppointmentDto, userId?: string): Promise<Appointment> {
    const settings = await this.getSettings();
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

    this.validateWithinWorkingHours(startDate, endDate, settings, doctor);

    await this.ensureNoOverlap({
      doctorId: doctor.id,
      start: startDate,
      end: endDate,
      bufferMinutes: settings.buffer_minutes ?? 0,
    });

    try {
      const appointment = this.appointmentRepository.create({
        ...createAppointmentDto,
        start_datetime: startDate,
        end_datetime: endDate,
        // created_by is nullable - null for public bookings, user_id for dashboard operations
        created_by: userId || null,
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
    userId?: string,
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
      } else {
        // Update existing patient's information if provided
        // This ensures the patient name and email are up-to-date
        let needsUpdate = false;
        if (createDto.patient.full_name && patient.full_name !== createDto.patient.full_name) {
          patient.full_name = createDto.patient.full_name;
          needsUpdate = true;
        }
        if (createDto.patient.email && patient.email !== createDto.patient.email) {
          patient.email = createDto.patient.email;
          needsUpdate = true;
        }
        if (needsUpdate) {
          patient = await this.patientRepository.save(patient);
        }
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

    return this.create(appointmentDto, userId);
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
    userId?: string,
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
    const settings = await this.getSettings();
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

    // Load the doctor to evaluate doctor-specific working hours for that day
    const doctorForValidation = await this.doctorRepository.findOne({
      where: {
        id: updateAppointmentDto.doctor_id || appointment.doctor_id,
      },
    });

    this.validateWithinWorkingHours(
      startDate,
      endDate,
      settings,
      doctorForValidation ?? undefined,
    );

    await this.ensureNoOverlap({
      doctorId: updateAppointmentDto.doctor_id || appointment.doctor_id,
      start: startDate,
      end: endDate,
      bufferMinutes: settings.buffer_minutes ?? 0,
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
      // updated_by is nullable - null for public updates, user_id for dashboard operations
      updated_by: userId || null,
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
    userId?: string,
  ): Promise<Appointment> {
    const appointment = await this.findOne(id);
    const settings = await this.getSettings();
    if (status === AppointmentStatus.CANCELLED) {
      const now = new Date();
      const cutoff = new Date(
        appointment.start_datetime.getTime() -
          (settings.cancellation_window_hours ?? 0) * 60 * 60 * 1000,
      );
      if (now > cutoff) {
        throw new BadRequestException(
          'Cancellation window has passed for this appointment',
        );
      }
    }
    appointment.status = status;
    // updated_by is nullable - null for public updates, user_id for dashboard operations
    appointment.updated_by = userId || null;

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

  async autoCancelPastBookedAppointments(userId?: string): Promise<{ cancelled: number }> {
    // Receptionist cannot use auto-cancel feature
    // Only admin, manager, and appointment-manager can use it
    await this.checkRolePermission(userId, [UserRole.ADMIN, UserRole.MANAGER]);
    
    const now = new Date();
    
    // Find all booked appointments that have passed their start time
    const pastBookedAppointments = await this.appointmentRepository
      .createQueryBuilder('appointment')
      .where('appointment.status = :status', { status: AppointmentStatus.BOOKED })
      .andWhere('appointment.start_datetime < :now', { now })
      .getMany();

    if (pastBookedAppointments.length === 0) {
      return { cancelled: 0 };
    }

    // Update all past booked appointments to cancelled
    const updateResult = await this.appointmentRepository
      .createQueryBuilder()
      .update(Appointment)
      .set({ status: AppointmentStatus.CANCELLED })
      .where('status = :status', { status: AppointmentStatus.BOOKED })
      .andWhere('start_datetime < :now', { now })
      .execute();

    return { cancelled: updateResult.affected || 0 };
  }
}


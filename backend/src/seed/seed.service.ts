import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Service } from '../services/entities/service.entity';
import { Doctor } from '../doctors/entities/doctor.entity';
import { DoctorLeave } from '../doctors/entities/doctor-leave.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { Patient } from '../patients/entities/patient.entity';
import { Appointment, AppointmentStatus } from '../appointments/entities/appointment.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
    @InjectRepository(Doctor)
    private readonly doctorRepository: Repository<Doctor>,
    @InjectRepository(DoctorLeave)
    private readonly doctorLeaveRepository: Repository<DoctorLeave>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>,
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
  ) {}

  async onModuleInit() {
    // Wait for database connection to be ready with retries
    await this.waitForDatabase();
    await this.seedAll();
  }

  private async waitForDatabase(maxRetries = 10, delay = 1000): Promise<void> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        // Try to query the database to check if connection is ready
        await this.serviceRepository.query('SELECT 1');
        this.logger.log('Database connection ready');
        return;
      } catch (error) {
        if (i < maxRetries - 1) {
          this.logger.warn(`Waiting for database connection... (${i + 1}/${maxRetries})`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        } else {
          this.logger.error('Database connection failed after retries');
          throw error;
        }
      }
    }
  }

  async seedAll() {
    this.logger.log('Starting database seeding...');
    try {
      await this.seedAdminUser();
      await this.seedServices();
      await this.seedDoctors();
      await this.seedPatientsAndAppointments();
      this.logger.log('Database seeding completed successfully');
    } catch (error) {
      this.logger.error(`Error during seeding: ${error.message}`, error.stack);
    }
  }

  private async seedServices() {
    const existingServices = await this.serviceRepository.count();
    
    if (existingServices > 0) {
      this.logger.log(`Services already exist (${existingServices} records). Skipping seed.`);
      return;
    }

    this.logger.log('Seeding Services...');

    const defaultServices: Partial<Service>[] = [
      {
        category: 'Preventive Care',
        name: 'Regular Checkup',
        duration_minutes: 30,
        active_status: true,
      },
      {
        category: 'Preventive Care',
        name: 'Teeth Cleaning',
        duration_minutes: 45,
        active_status: true,
      },
      {
        category: 'Preventive Care',
        name: 'Fluoride Treatment',
        duration_minutes: 15,
        active_status: true,
      },
      {
        category: 'Restorative',
        name: 'Tooth Filling',
        duration_minutes: 60,
        active_status: true,
      },
      {
        category: 'Restorative',
        name: 'Root Canal Treatment',
        duration_minutes: 90,
        active_status: true,
      },
      {
        category: 'Restorative',
        name: 'Crown Placement',
        duration_minutes: 120,
        active_status: true,
      },
      {
        category: 'Cosmetic',
        name: 'Teeth Whitening',
        duration_minutes: 60,
        active_status: true,
      },
      {
        category: 'Cosmetic',
        name: 'Veneers Consultation',
        duration_minutes: 45,
        active_status: true,
      },
      {
        category: 'Orthodontics',
        name: 'Braces Consultation',
        duration_minutes: 60,
        active_status: true,
      },
      {
        category: 'Orthodontics',
        name: 'Braces Adjustment',
        duration_minutes: 30,
        active_status: true,
      },
      {
        category: 'Oral Surgery',
        name: 'Tooth Extraction',
        duration_minutes: 45,
        active_status: true,
      },
      {
        category: 'Oral Surgery',
        name: 'Wisdom Tooth Removal',
        duration_minutes: 90,
        active_status: true,
      },
    ];

    try {
      const services = this.serviceRepository.create(defaultServices);
      await this.serviceRepository.save(services);
      this.logger.log(`Successfully seeded ${services.length} services`);
    } catch (error) {
      this.logger.error(`Error seeding services: ${error.message}`, error.stack);
      throw error;
    }
  }

  private async seedDoctors() {
    const existingDoctors = await this.doctorRepository.count();

    if (existingDoctors > 0) {
      this.logger.log(`Doctors already exist (${existingDoctors} records). Skipping seed.`);
      return;
    }

    this.logger.log('Seeding Doctors...');

    const defaultDoctors: Partial<Doctor>[] = [
      {
        name: 'Dr. Sarah Johnson',
        specialization: 'General Dentistry',
        services_offered: ['Regular Checkup', 'Teeth Cleaning', 'Tooth Filling', 'Root Canal Treatment'],
        working_hours: {
          monday: { start: '09:00', end: '17:00' },
          tuesday: { start: '09:00', end: '17:00' },
          wednesday: { start: '09:00', end: '17:00' },
          thursday: { start: '09:00', end: '17:00' },
          friday: { start: '09:00', end: '15:00' },
          saturday: { start: '10:00', end: '14:00' },
          sunday: null,
        },
      },
      {
        name: 'Dr. Michael Chen',
        specialization: 'Orthodontics',
        services_offered: ['Braces Consultation', 'Braces Adjustment', 'Teeth Cleaning'],
        working_hours: {
          monday: { start: '10:00', end: '18:00' },
          tuesday: { start: '10:00', end: '18:00' },
          wednesday: { start: '10:00', end: '18:00' },
          thursday: { start: '10:00', end: '18:00' },
          friday: { start: '10:00', end: '16:00' },
          saturday: null,
          sunday: null,
        },
      },
      {
        name: 'Dr. Emily Rodriguez',
        specialization: 'Oral Surgery',
        services_offered: ['Tooth Extraction', 'Wisdom Tooth Removal', 'Oral Surgery Consultation'],
        working_hours: {
          monday: { start: '08:00', end: '16:00' },
          tuesday: { start: '08:00', end: '16:00' },
          wednesday: { start: '08:00', end: '16:00' },
          thursday: { start: '08:00', end: '16:00' },
          friday: { start: '08:00', end: '14:00' },
          saturday: null,
          sunday: null,
        },
      },
      {
        name: 'Dr. James Wilson',
        specialization: 'Cosmetic Dentistry',
        services_offered: ['Teeth Whitening', 'Veneers Consultation', 'Regular Checkup'],
        working_hours: {
          monday: { start: '09:00', end: '17:00' },
          tuesday: { start: '09:00', end: '17:00' },
          wednesday: { start: '09:00', end: '17:00' },
          thursday: { start: '09:00', end: '17:00' },
          friday: { start: '09:00', end: '15:00' },
          saturday: { start: '09:00', end: '13:00' },
          sunday: null,
        },
      },
    ];

    try {
      const doctors = this.doctorRepository.create(defaultDoctors);
      const savedDoctors = await this.doctorRepository.save(doctors);
      this.logger.log(`Successfully seeded ${savedDoctors.length} doctors`);
    } catch (error) {
      this.logger.error(`Error seeding doctors: ${error.message}`, error.stack);
      throw error;
    }
  }

  private async seedAdminUser() {
    const adminEmail = process.env.DEFAULT_ADMIN_EMAIL ?? 'admin@skydentalclinic.com';
    const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD ?? 'admin123';
    const adminPhone = process.env.DEFAULT_ADMIN_PHONE ?? '+971-50-123-4567';

    const existingAdmin = await this.userRepository.findOne({
      where: { email: adminEmail },
    });

    if (existingAdmin) {
      this.logger.log('Admin user already exists. Skipping admin seed.');
      return;
    }

    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    const adminUser = this.userRepository.create({
      email: adminEmail,
      password: hashedPassword,
      full_name: 'Sky Dental Admin',
      phone_number: adminPhone,
      role: UserRole.ADMIN,
      is_active: true,
      email_verified: true,
      last_login: new Date(),
    });

    await this.userRepository.save(adminUser);
    this.logger.log(`Seeded default admin user (${adminEmail})`);
  }

  /**
   * Seed patients and appointments with varied statuses so the UI can surface flags
   * (VIP via visit count, no-show risk via missed/cancelled visits).
   */
  private async seedPatientsAndAppointments() {
    const existingPatients = await this.patientRepository.count();
    const existingAppointments = await this.appointmentRepository.count();
    const batchSuffix = Date.now().toString(); // keep phones/emails unique per run

    // Ensure prerequisites exist
    const doctors = await this.doctorRepository.find();
    const services = await this.serviceRepository.find();

    if (doctors.length === 0 || services.length === 0) {
      this.logger.warn(
        'Cannot seed patients/appointments because doctors or services are missing.',
      );
      return;
    }

    this.logger.log('Seeding Patients and Appointments...');

    // Diverse patient set to surface VIP / risk / clean states on the UI.
    // Phones/emails are made unique per run to avoid conflicts when data already exists.
    const patients = this.patientRepository.create([
      {
        full_name: 'Ahmed Al Mansoori', // VIP (lots of visits)
        phone_number: `+971-50-${batchSuffix.slice(-7)}`,
        email: `ahmed${batchSuffix}@email.com`,
      },
      {
        full_name: 'Fatima Hassan', // Risk (no-shows/cancellations)
        phone_number: `+971-55-${(Number(batchSuffix.slice(-7)) + 1).toString().padStart(7, '0')}`,
        email: `fatima${batchSuffix}@email.com`,
      },
      {
        full_name: 'Lina Carter', // VIP + Risk
        phone_number: `+971-56-${(Number(batchSuffix.slice(-7)) + 2).toString().padStart(7, '0')}`,
        email: `lina${batchSuffix}@email.com`,
      },
      {
        full_name: 'Omar Abdullah', // Clean (no flags)
        phone_number: `+971-50-${(Number(batchSuffix.slice(-7)) + 3).toString().padStart(7, '0')}`,
        email: `omar${batchSuffix}@email.com`,
      },
      {
        full_name: 'Sarah Johnson', // Light risk (single no-show)
        phone_number: `+971-52-${(Number(batchSuffix.slice(-7)) + 4).toString().padStart(7, '0')}`,
        email: `sarah${batchSuffix}@email.com`,
      },
      {
        full_name: 'Yousef Rahman', // VIP (visits only)
        phone_number: `+971-54-${(Number(batchSuffix.slice(-7)) + 5).toString().padStart(7, '0')}`,
        email: `yousef${batchSuffix}@email.com`,
      },
    ]);

    const savedPatients = await this.patientRepository.save(patients);

    // Helper to generate start/end datetimes
    const makeSlot = (daysAgo: number, hour: number) => {
      const start = new Date();
      start.setDate(start.getDate() - daysAgo);
      start.setHours(hour, 0, 0, 0);
      const end = new Date(start.getTime() + 45 * 60 * 1000);
      return { start, end };
    };

    const doctor = doctors[0];
    const service = services[0];

    const appointments: Partial<Appointment>[] = [];

    // Helper to push a block of appointments
    const pushAppointments = (
      patientId: string,
      entries: { daysAgo: number; status: AppointmentStatus; hour?: number; note?: string }[],
    ) => {
      entries.forEach((entry, idx) => {
        const slot = makeSlot(entry.daysAgo, entry.hour ?? 9 + (idx % 3));
        appointments.push({
          patient_id: patientId,
          doctor_id: doctor.id,
          service_id: service.id,
          start_datetime: slot.start,
          end_datetime: slot.end,
          status: entry.status,
          notes: entry.note,
        });
      });
    };

    // VIP (Ahmed): 12 completed visits
    pushAppointments(savedPatients[0].id,
      Array.from({ length: 12 }).map((_, i) => ({
        daysAgo: 10 + i,
        status: AppointmentStatus.COMPLETED,
        note: 'Routine checkup',
      })),
    );

    // Risk (Fatima): multiple no-show/cancelled
    pushAppointments(savedPatients[1].id, [
      { daysAgo: 3, status: AppointmentStatus.NO_SHOW, note: 'Missed appointment' },
      { daysAgo: 9, status: AppointmentStatus.CANCELLED, note: 'Cancelled same day' },
      { daysAgo: 16, status: AppointmentStatus.CANCELLED, note: 'Cancelled 1 day prior' },
      { daysAgo: 22, status: AppointmentStatus.COMPLETED, note: 'Completed visit' },
    ]);

    // VIP + Risk (Lina): 11 completed + 1 no-show
    pushAppointments(savedPatients[2].id, [
      ...Array.from({ length: 11 }).map((_, i) => ({
        daysAgo: 8 + i,
        status: AppointmentStatus.COMPLETED,
        note: 'Follow-up care',
      })),
      { daysAgo: 4, status: AppointmentStatus.NO_SHOW, note: 'Missed due to conflict' },
    ]);

    // Clean (Omar): few completed, no flags
    pushAppointments(savedPatients[3].id, [
      { daysAgo: 5, status: AppointmentStatus.COMPLETED, note: 'Checkup' },
      { daysAgo: 18, status: AppointmentStatus.COMPLETED, note: 'Cleaning' },
    ]);

    // Light risk (Sarah): single no-show
    pushAppointments(savedPatients[4].id, [
      { daysAgo: 6, status: AppointmentStatus.NO_SHOW, note: 'Missed slot' },
      { daysAgo: 14, status: AppointmentStatus.COMPLETED, note: 'Previous visit' },
    ]);

    // VIP only (Yousef): 10 completed
    pushAppointments(savedPatients[5].id,
      Array.from({ length: 10 }).map((_, i) => ({
        daysAgo: 12 + i,
        status: AppointmentStatus.COMPLETED,
        note: 'Routine visit',
      })),
    );

    // Append appointments even if some already exist; IDs/time slots are unique per run.
    if (appointments.length > 0) {
      const savedAppointments = this.appointmentRepository.create(appointments);
      await this.appointmentRepository.save(savedAppointments);
      this.logger.log(
        `Seeded ${savedPatients.length} patients and ${savedAppointments.length} appointments (existing patients: ${existingPatients}, existing appointments: ${existingAppointments})`,
      );
    }
  }
}

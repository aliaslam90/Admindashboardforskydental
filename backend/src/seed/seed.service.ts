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
    this.logger.log('Seeding Services...');

    const defaultServices: Partial<Service>[] = [
      { category: 'Preventive Care', name: 'Regular Checkup', duration_minutes: 30, active_status: true },
      { category: 'Preventive Care', name: 'Teeth Cleaning', duration_minutes: 45, active_status: true },
      { category: 'Preventive Care', name: 'Fluoride Treatment', duration_minutes: 15, active_status: true },
      { category: 'Restorative', name: 'Tooth Filling', duration_minutes: 60, active_status: true },
      { category: 'Restorative', name: 'Root Canal Treatment', duration_minutes: 90, active_status: true },
      { category: 'Restorative', name: 'Crown Placement', duration_minutes: 120, active_status: true },
      { category: 'Cosmetic', name: 'Teeth Whitening', duration_minutes: 60, active_status: true },
      { category: 'Cosmetic', name: 'Veneers Consultation', duration_minutes: 45, active_status: true },
      { category: 'Orthodontics', name: 'Braces Consultation', duration_minutes: 60, active_status: true },
      { category: 'Orthodontics', name: 'Braces Adjustment', duration_minutes: 30, active_status: true },
      { category: 'Oral Surgery', name: 'Tooth Extraction', duration_minutes: 45, active_status: true },
      { category: 'Oral Surgery', name: 'Wisdom Tooth Removal', duration_minutes: 90, active_status: true },
    ];

    let created = 0;
    for (const svc of defaultServices) {
      const existing = await this.serviceRepository.findOne({ where: { name: svc.name } });
      if (existing) {
        const updated = Object.assign(existing, svc);
        await this.serviceRepository.save(updated);
      } else {
        const newSvc = this.serviceRepository.create(svc);
        await this.serviceRepository.save(newSvc);
        created += 1;
      }
    }
    this.logger.log(`Services seed complete. Added ${created} new services.`);
  }

  private async seedDoctors() {
    this.logger.log('Seeding Doctors...');

    // Fetch services to reference IDs
    const services = await this.serviceRepository.find();
    const byName = (name: string) =>
      services.find((s) => s.name === name)?.id?.toString();

    const defaultDoctors: Partial<Doctor>[] = [
      {
        name: 'Dr. Sarah Johnson',
        specialization: 'General Dentistry',
        status: 'active' as any,
        services_offered: [
          byName('Regular Checkup'),
          byName('Teeth Cleaning'),
          byName('Tooth Filling'),
          byName('Root Canal Treatment'),
        ].filter(Boolean) as string[],
        working_hours: {
          monday: [{ start: '09:00', end: '17:00' }],
          tuesday: [{ start: '09:00', end: '17:00' }],
          wednesday: [{ start: '09:00', end: '17:00' }],
          thursday: [{ start: '09:00', end: '17:00' }],
          friday: [{ start: '09:00', end: '15:00' }],
          saturday: [{ start: '10:00', end: '14:00' }],
          sunday: [],
        },
      },
      {
        name: 'Dr. Michael Chen',
        specialization: 'Orthodontics',
        status: 'active' as any,
        services_offered: [
          byName('Braces Consultation'),
          byName('Braces Adjustment'),
          byName('Teeth Cleaning'),
        ].filter(Boolean) as string[],
        working_hours: {
          monday: [{ start: '10:00', end: '18:00' }],
          tuesday: [{ start: '10:00', end: '18:00' }],
          wednesday: [{ start: '10:00', end: '18:00' }],
          thursday: [{ start: '10:00', end: '18:00' }],
          friday: [{ start: '10:00', end: '16:00' }],
          saturday: [],
          sunday: [],
        },
      },
      {
        name: 'Dr. Emily Rodriguez',
        specialization: 'Oral Surgery',
        status: 'inactive' as any,
        services_offered: [
          byName('Tooth Extraction'),
          byName('Wisdom Tooth Removal'),
          byName('Regular Checkup'),
        ].filter(Boolean) as string[],
        working_hours: {
          monday: [{ start: '08:00', end: '16:00' }],
          tuesday: [{ start: '08:00', end: '16:00' }],
          wednesday: [{ start: '08:00', end: '16:00' }],
          thursday: [{ start: '08:00', end: '16:00' }],
          friday: [{ start: '08:00', end: '14:00' }],
          saturday: [],
          sunday: [],
        },
      },
      {
        name: 'Dr. James Wilson',
        specialization: 'Cosmetic Dentistry',
        status: 'active' as any,
        services_offered: [
          byName('Teeth Whitening'),
          byName('Veneers Consultation'),
          byName('Regular Checkup'),
        ].filter(Boolean) as string[],
        working_hours: {
          monday: [{ start: '09:00', end: '17:00' }],
          tuesday: [{ start: '09:00', end: '17:00' }],
          wednesday: [{ start: '09:00', end: '17:00' }],
          thursday: [{ start: '09:00', end: '17:00' }],
          friday: [{ start: '09:00', end: '15:00' }],
          saturday: [{ start: '09:00', end: '13:00' }],
          sunday: [],
        },
      },
    ];

    let created = 0;
    for (const doc of defaultDoctors) {
      if (!doc.name) continue;
      const existing = await this.doctorRepository.findOne({ where: { name: doc.name } });
      if (existing) {
        existing.specialization = doc.specialization ?? existing.specialization;
        existing.status = (doc.status as any) ?? existing.status;
        existing.services_offered = doc.services_offered ?? existing.services_offered;
        existing.working_hours = doc.working_hours ?? existing.working_hours;
        await this.doctorRepository.save(existing);
      } else {
        const newDoc = this.doctorRepository.create(doc);
        await this.doctorRepository.save(newDoc);
        created += 1;
      }
    }
    this.logger.log(`Doctors seed complete. Added ${created} new doctors.`);
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
    // Ensure prerequisites exist
    const doctors = await this.doctorRepository.find();
    const services = await this.serviceRepository.find();

    if (doctors.length === 0 || services.length === 0) {
      this.logger.warn('Cannot seed patients/appointments because doctors or services are missing.');
      return;
    }

    this.logger.log('Seeding Patients and Appointments (idempotent)...');

    const patientTemplates = [
      { full_name: 'Ahmed Al Mansoori', phone_number: '+971-50-123-4567', email: 'ahmed@email.com' },
      { full_name: 'Fatima Hassan', phone_number: '+971-55-234-5678', email: 'fatima@email.com' },
      { full_name: 'Lina Carter', phone_number: '+971-56-678-9012', email: 'lina@email.com' },
      { full_name: 'Omar Abdullah', phone_number: '+971-50-567-8901', email: 'omar@email.com' },
      { full_name: 'Sarah Johnson', phone_number: '+971-52-456-7890', email: 'sarah@email.com' },
      { full_name: 'Yousef Rahman', phone_number: '+971-54-345-6789', email: 'yousef@email.com' },
    ];

    const savedPatients: Patient[] = [];
    for (const p of patientTemplates) {
      const existing = await this.patientRepository.findOne({ where: { phone_number: p.phone_number } });
      if (existing) {
        savedPatients.push(existing);
      } else {
        const created = this.patientRepository.create(p);
        const saved = await this.patientRepository.save(created);
        savedPatients.push(saved);
      }
    }

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

    const appointmentTemplates: {
      patient: Patient;
      daysAgo: number;
      status: AppointmentStatus;
      hour?: number;
      note?: string;
    }[] = [];

    const pushTemplates = (
      patient: Patient,
      entries: { daysAgo: number; status: AppointmentStatus; hour?: number; note?: string }[],
    ) => {
      entries.forEach((entry, idx) => {
        appointmentTemplates.push({
          patient,
          daysAgo: entry.daysAgo,
          status: entry.status,
          hour: entry.hour ?? 9 + (idx % 3),
          note: entry.note,
        });
      });
    };

    pushTemplates(savedPatients[0], Array.from({ length: 12 }).map((_, i) => ({
      daysAgo: 10 + i,
      status: AppointmentStatus.COMPLETED,
      note: 'Routine checkup',
    })));

    pushTemplates(savedPatients[1], [
      { daysAgo: 3, status: AppointmentStatus.NO_SHOW, note: 'Missed appointment' },
      { daysAgo: 9, status: AppointmentStatus.CANCELLED, note: 'Cancelled same day' },
      { daysAgo: 16, status: AppointmentStatus.CANCELLED, note: 'Cancelled 1 day prior' },
      { daysAgo: 22, status: AppointmentStatus.COMPLETED, note: 'Completed visit' },
    ]);

    pushTemplates(savedPatients[2], [
      ...Array.from({ length: 11 }).map((_, i) => ({
        daysAgo: 8 + i,
        status: AppointmentStatus.COMPLETED,
        note: 'Follow-up care',
      })),
      { daysAgo: 4, status: AppointmentStatus.NO_SHOW, note: 'Missed due to conflict' },
    ]);

    pushTemplates(savedPatients[3], [
      { daysAgo: 5, status: AppointmentStatus.COMPLETED, note: 'Checkup' },
      { daysAgo: 18, status: AppointmentStatus.COMPLETED, note: 'Cleaning' },
    ]);

    pushTemplates(savedPatients[4], [
      { daysAgo: 6, status: AppointmentStatus.NO_SHOW, note: 'Missed slot' },
      { daysAgo: 14, status: AppointmentStatus.COMPLETED, note: 'Previous visit' },
    ]);

    pushTemplates(savedPatients[5], Array.from({ length: 10 }).map((_, i) => ({
      daysAgo: 12 + i,
      status: AppointmentStatus.COMPLETED,
      note: 'Routine visit',
    })));

    let createdAppointments = 0;
    for (const tmpl of appointmentTemplates) {
      const slot = makeSlot(tmpl.daysAgo, tmpl.hour ?? 9);
      const existing = await this.appointmentRepository.findOne({
        where: {
          patient_id: tmpl.patient.id,
          doctor_id: doctor.id,
          start_datetime: slot.start,
        },
      });
      if (existing) continue;

      const appointment = this.appointmentRepository.create({
        patient_id: tmpl.patient.id,
        doctor_id: doctor.id,
        service_id: service.id,
        start_datetime: slot.start,
        end_datetime: slot.end,
        status: tmpl.status,
        notes: tmpl.note,
      });
      await this.appointmentRepository.save(appointment);
      createdAppointments += 1;
    }

    this.logger.log(
      `Patients/appointments seed complete. Patients ensured: ${savedPatients.length}, new appointments: ${createdAppointments}`,
    );
  }
}

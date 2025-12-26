import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Service } from '../services/entities/service.entity';
import { Doctor } from '../doctors/entities/doctor.entity';
import { DoctorLeave } from '../doctors/entities/doctor-leave.entity';

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
      await this.seedServices();
      await this.seedDoctors();
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
}

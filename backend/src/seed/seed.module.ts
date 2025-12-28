import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeedService } from './seed.service';
import { Service } from '../services/entities/service.entity';
import { Doctor } from '../doctors/entities/doctor.entity';
import { DoctorLeave } from '../doctors/entities/doctor-leave.entity';
import { User } from '../users/entities/user.entity';
import { Patient } from '../patients/entities/patient.entity';
import { Appointment } from '../appointments/entities/appointment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Service,
      Doctor,
      DoctorLeave,
      User,
      Patient,
      Appointment,
    ]),
  ],
  providers: [SeedService],
  exports: [SeedService],
})
export class SeedModule {}

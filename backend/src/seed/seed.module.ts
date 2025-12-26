import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeedService } from './seed.service';
import { Service } from '../services/entities/service.entity';
import { Doctor } from '../doctors/entities/doctor.entity';
import { DoctorLeave } from '../doctors/entities/doctor-leave.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Service, Doctor, DoctorLeave, User])],
  providers: [SeedService],
  exports: [SeedService],
})
export class SeedModule {}

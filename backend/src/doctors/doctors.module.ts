import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DoctorsService } from './doctors.service';
import { DoctorsController } from './doctors.controller';
import { Doctor } from './entities/doctor.entity';
import { DoctorLeave } from './entities/doctor-leave.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Doctor, DoctorLeave])],
  controllers: [DoctorsController],
  providers: [DoctorsService],
  exports: [DoctorsService],
})
export class DoctorsModule {}

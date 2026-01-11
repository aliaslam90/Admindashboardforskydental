import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CalendarController } from './calendar.controller';
import { CalendarService } from './calendar.service';
import { AppointmentSettings } from '../settings/entities/appointment-settings.entity';
import { Appointment } from '../appointments/entities/appointment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([AppointmentSettings, Appointment]),
  ],
  controllers: [CalendarController],
  providers: [CalendarService],
  exports: [CalendarService],
})
export class CalendarModule {}


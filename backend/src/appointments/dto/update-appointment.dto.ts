import { PartialType } from '@nestjs/mapped-types';
import { CreateAppointmentDto } from './create-appointment.dto';
import { AppointmentStatus } from '../entities/appointment.entity';

// Explicitly redeclare fields to keep type-checkers happy in partial updates.
export class UpdateAppointmentDto extends PartialType(CreateAppointmentDto) {
  patient_id?: string;
  doctor_id?: number;
  service_id?: number;
  start_datetime?: string;
  end_datetime?: string;
  status?: AppointmentStatus;
  calendar_event_id?: string;
  notes?: string;
}


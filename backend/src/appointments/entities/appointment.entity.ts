import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Patient } from '../../patients/entities/patient.entity';
import { Doctor } from '../../doctors/entities/doctor.entity';
import { Service } from '../../services/entities/service.entity';

export enum AppointmentStatus {
  PENDING_CONFIRMATION = 'pending_confirmation',
  BOOKED = 'booked',
  CONFIRMED = 'confirmed',
  CHECKED_IN = 'checked_in',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
  RESCHEDULED = 'rescheduled',
}

@Entity('Appointments')
export class Appointment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  patient_id: string;

  @Column({ type: 'int' })
  doctor_id: number;

  @Column({ type: 'int' })
  service_id: number;

  @Column({ type: 'timestamp' })
  start_datetime: Date;

  @Column({ type: 'timestamp' })
  end_datetime: Date;

  @Column({
    type: 'enum',
    enum: AppointmentStatus,
    default: AppointmentStatus.PENDING_CONFIRMATION,
  })
  status: AppointmentStatus;

  @Column({ type: 'varchar', length: 255, nullable: true })
  calendar_event_id: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @ManyToOne(() => Patient, { eager: true })
  @JoinColumn({ name: 'patient_id' })
  patient: Patient;

  @ManyToOne(() => Doctor, { eager: true })
  @JoinColumn({ name: 'doctor_id' })
  doctor: Doctor;

  @ManyToOne(() => Service, { eager: true })
  @JoinColumn({ name: 'service_id' })
  service: Service;

  // Audit fields: nullable to support public booking (when created_by is null)
  // and dashboard operations (when created_by/updated_by contain user_id)
  @Column({ type: 'uuid', nullable: true, name: 'created_by' })
  created_by: string | null;

  @Column({ type: 'uuid', nullable: true, name: 'updated_by' })
  updated_by: string | null;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}


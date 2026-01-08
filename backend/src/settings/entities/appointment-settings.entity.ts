import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('AppointmentSettings')
export class AppointmentSettings {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', default: 15 })
  buffer_minutes: number;

  @Column({ type: 'int', default: 24 })
  cancellation_window_hours: number;

  @Column({ type: 'boolean', default: false })
  otp_required: boolean;

  @Column({ type: 'int', default: 5 })
  otp_expiry_minutes: number;

  @Column({ type: 'varchar', length: 5, default: '09:00' })
  opening_time: string; // HH:mm

  @Column({ type: 'varchar', length: 5, default: '18:00' })
  closing_time: string; // HH:mm

  @Column({ type: 'jsonb', default: () => `'["Sunday","Monday","Tuesday","Wednesday","Thursday", "Friday", "Saturday"]'` })
  working_days: string[];

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}


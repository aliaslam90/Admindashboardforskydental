import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Doctor } from './doctor.entity';

@Entity('DoctorLeaves')
export class DoctorLeave {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', name: 'doctor_id' })
  doctor_id: number;

  @ManyToOne(() => Doctor, (doctor) => doctor.leave_dates, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'doctor_id' })
  doctor: Doctor;

  @Column({ type: 'date', name: 'leave_date' })
  leave_date: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  reason: string;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}

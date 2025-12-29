import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { DoctorLeave } from './doctor-leave.entity';

export enum DoctorStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

@Entity('Doctors')
export class Doctor {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255 })
  specialization: string;

  @Column({
    type: 'enum',
    enum: DoctorStatus,
    default: DoctorStatus.ACTIVE,
  })
  status: DoctorStatus;

  @Column({ type: 'jsonb', name: 'services_offered', nullable: true })
  services_offered: string[];

  @Column({ type: 'jsonb', name: 'working_hours', nullable: true })
  working_hours: Record<string, any>;

  @OneToMany(() => DoctorLeave, (leave) => leave.doctor, { cascade: true })
  leave_dates: DoctorLeave[];

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}

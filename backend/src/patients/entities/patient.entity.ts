import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('Patients')
export class Patient {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  full_name: string;

  @Column({ type: 'varchar', length: 20, unique: true })
  phone_number: string;

  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Column({ type: 'varchar', length: 4, nullable: true })
  emirates_id_last4: string;

  // Audit fields: nullable to support public registration (when created_by is null)
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


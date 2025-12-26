import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('Services')
export class Service {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  category: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'int', name: 'duration_minutes' })
  duration_minutes: number;

  @Column({ type: 'boolean', default: true, name: 'active_status' })
  active_status: boolean;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { ReservationItem } from './reservation-item.entity';

@Entity('reservations')
export class Reservation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'temp_id', nullable: true })
  tempId: string;

  @Column({ default: 'ACTIVE' })
  status: string; // ACTIVE, CANCELLED, CONFIRMED

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => ReservationItem, (item: ReservationItem) => item.reservation, { cascade: true })
  items: ReservationItem[];
}

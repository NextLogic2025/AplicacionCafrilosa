import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Reservation } from './reservation.entity';

@Entity('reservation_items')
export class ReservationItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'product_id', type: 'uuid' })
  productId: string;

  @Column({ nullable: true })
  sku: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  quantity: number;

  @Column({ name: 'stock_ubicacion_id', type: 'uuid', nullable: true })
  stockUbicacionId: string;

  @ManyToOne(() => Reservation, (res) => res.items)
  @JoinColumn({ name: 'reservation_id' })
  reservation: Reservation;
}

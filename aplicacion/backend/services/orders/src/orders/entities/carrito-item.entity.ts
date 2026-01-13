import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { CarritoCabecera } from './carrito-cabecera.entity';

@Entity('carritos_items')
export class CarritoItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  carrito_id: string;

  @Column({ type: 'uuid' })
  producto_id: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  cantidad: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  precio_unitario_ref: number;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @ManyToOne(() => CarritoCabecera, (carrito) => carrito.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'carrito_id' })
  carrito: CarritoCabecera;
}
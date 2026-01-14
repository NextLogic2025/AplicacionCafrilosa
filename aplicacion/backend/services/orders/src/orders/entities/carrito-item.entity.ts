import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { CarritoCabecera } from './carrito-cabecera.entity';

@Entity('carritos_items')
@Index(['carrito_id', 'producto_id'], { unique: true })
export class CarritoItem {

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  carrito_id: string;

  @Column({ type: 'uuid' })
  producto_id: string;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => Number(value),
    },
  })
  cantidad: number;

  @Column({
    name: 'precio_unitario_ref',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => Number(value),
    },
  })
  precio_unitario_ref: number;

  @Column({
    name: 'precio_original_snapshot',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => Number(value),
    },
  })
  precio_original_snapshot: number | null;

  @Column({ name: 'campania_aplicada_id', type: 'int', nullable: true })
  campania_aplicada_id: number | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  motivo_descuento: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @ManyToOne(() => CarritoCabecera, (carrito) => carrito.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'carrito_id' })
  carrito: CarritoCabecera;
}

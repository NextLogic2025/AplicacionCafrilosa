import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { CarritoItem } from './carrito-item.entity';

@Entity('carritos_cabecera')
export class CarritoCabecera {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  usuario_id: string;

  @Column({ type: 'uuid', nullable: true })
  cliente_id: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  total_estimado: number;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @Column({ type: 'timestamptz', nullable: true })
  deleted_at: Date;

  @OneToMany(() => CarritoItem, (item) => item.carrito, { cascade: true })
  items: CarritoItem[];
}
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Pedido } from './pedido.entity';

@Entity('detalles_pedido')
export class DetallePedido {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  pedido_id: string;

  @ManyToOne(() => Pedido, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pedido_id' })
  pedido: Pedido;

  @Column({ type: 'uuid' })
  producto_id: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  codigo_sku: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  nombre_producto: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  cantidad: number;

  @Column({ type: 'varchar', length: 20, nullable: true })
  unidad_medida: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  precio_lista: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  precio_original_snapshot: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  precio_final: number | null;

  @Column({ type: 'int', nullable: true })
  campania_aplicada_id: number | null;

  @Column({ type: 'timestamptz', nullable: true })
  precio_timestamp: Date | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  motivo_descuento: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true, insert: false, update: false })
  subtotal_linea: number | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}

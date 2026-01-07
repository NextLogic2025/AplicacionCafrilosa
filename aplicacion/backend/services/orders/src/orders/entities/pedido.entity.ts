import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Generated } from 'typeorm';

@Entity('pedidos')
export class Pedido {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'bigint', unique: true, nullable: true })
  @Generated('increment')
  codigo_visual: number;

  @Column({ type: 'uuid', nullable: false })
  cliente_id: string;

  @Column({ type: 'uuid', nullable: false })
  vendedor_id: string;

  @Column({ type: 'uuid', nullable: true })
  sucursal_id: string | null;

  @Column({ type: 'varchar', length: 50, default: 'PENDIENTE' })
  estado_actual: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  descuento_total: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  impuestos_total: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  total_final: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  condicion_pago: string | null;

  @Column({ type: 'date', nullable: true })
  fecha_entrega_solicitada: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  origen_pedido: string | null;

  @Column({ type: 'geometry', spatialFeatureType: 'Point', srid: 4326, nullable: true })
  ubicacion_pedido: any;

  @Column({ type: 'text', nullable: true })
  observaciones_entrega: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @Column({ type: 'timestamptz', nullable: true })
  deleted_at: Date | null;
}

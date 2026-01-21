import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { DetallePedido } from './detalle-pedido.entity';

@Entity('pedidos')
export class Pedido {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'int', generated: true })
  codigo_visual: number;

  @Column({ type: 'uuid' })
  cliente_id: string;

  @Column({ type: 'uuid', nullable: true })
  vendedor_id: string;

  @Column({ type: 'uuid', nullable: true })
  sucursal_id: string;

  @Column({ type: 'varchar', length: 20, default: 'PENDIENTE' })
  estado_actual: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  descuento_total: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  impuestos_total: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  total_final: number;

  // Facturación
  @Column({ type: 'uuid', nullable: true })
  factura_id: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  factura_numero: string | null;

  @Column({ type: 'text', nullable: true })
  url_pdf_factura: string | null;

  @Column({ type: 'varchar', length: 20, default: 'CREDITO' })
  forma_pago_solicitada: string;

  @Column({ type: 'varchar', length: 20, default: 'PENDIENTE' })
  estado_pago: string;


  @Column({ type: 'uuid', nullable: true })
  reservation_id: string | null;

  @Column({ type: 'date', nullable: true })
  fecha_entrega_solicitada: Date;

  @Column({ type: 'varchar', length: 20, nullable: true })
  origen_pedido: string;

  // Manejo de PostGIS para ubicación del pedido
  @Column({
    type: 'geometry',
    spatialFeatureType: 'Point',
    srid: 4326,
    nullable: true,
    name: 'ubicacion_pedido'
  })
  ubicacion_pedido: string;

  @Column({ type: 'text', nullable: true })
  observaciones_entrega: string;

  @CreateDateColumn({ type: 'timestamp with time zone', name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone', name: 'updated_at' })
  updated_at: Date;

  @Column({ type: 'timestamp with time zone', nullable: true, name: 'deleted_at' })
  deleted_at: Date;

  @OneToMany(() => DetallePedido, (detalle) => detalle.pedido, { cascade: true })
  detalles: DetallePedido[];
}
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { DetallePedido } from './detalle-pedido.entity';

@Entity('pedidos')
export class Pedido {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  cliente_id: string;

  @Column({ type: 'uuid', nullable: true })
  sucursal_id: string;

  @Column({ type: 'varchar', length: 20, default: 'PENDIENTE' })
  estado_actual: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  total_neto: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  total_impuestos: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  total_pedido: number;

  // Manejo de PostGIS para la imagen del requisito de entrega
  @Column({
    type: 'geometry',
    spatialFeatureType: 'Point',
    srid: 4326,
    nullable: true,
  })
  geolocalizacion_entrega: string;

  @Column({ type: 'text', nullable: true })
  notas: string;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  fecha_creacion: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  fecha_actualizacion: Date;

  @OneToMany(() => DetallePedido, (detalle) => detalle.pedido, { cascade: true })
  detalles: DetallePedido[];
}
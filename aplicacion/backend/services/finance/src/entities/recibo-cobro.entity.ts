import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('recibos_cobro')
export class ReciboCobro {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'cliente_id', type: 'uuid' })
  clienteId: string;

  @Column({ name: 'vendedor_id', type: 'uuid' })
  vendedorId: string;

  @Column({ name: 'codigo_recibo', length: 50, nullable: true })
  codigoRecibo: string | null;

  @CreateDateColumn({ name: 'fecha_cobro', type: 'timestamptz' })
  fechaCobro: Date;

  @Column({ name: 'monto_total', type: 'decimal', precision: 12, scale: 2 })
  montoTotal: number;

  @Column({ name: 'forma_pago', length: 20, default: 'EFECTIVO' })
  formaPago: string;

  @Column({ name: 'foto_comprobante_url', type: 'text', nullable: true })
  fotoComprobanteUrl: string | null;

  @Column({ name: 'ubicacion_gps', type: 'geometry', spatialFeatureType: 'Point', srid: 4326, nullable: true })
  ubicacionGps: any | null;

  @Column({ name: 'estado_liquidacion', length: 20, default: 'EN_MANO_VENDEDOR' })
  estadoLiquidacion: string;

  @Column({ name: 'observaciones', type: 'text', nullable: true })
  observaciones: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}

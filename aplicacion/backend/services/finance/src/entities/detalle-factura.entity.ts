import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Factura } from './factura.entity';

@Entity('factura_detalle')
export class DetalleFactura {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'factura_id', type: 'uuid' })
  facturaId: string;

  @ManyToOne(() => Factura, (f) => f.detalles)
  @JoinColumn({ name: 'factura_id' })
  factura: Factura;

  @Column({ name: 'producto_id', type: 'uuid' })
  productoId: string;

  @Column({ name: 'descripcion', length: 300 })
  descripcion: string;

  @Column({ name: 'cantidad', type: 'numeric', precision: 12, scale: 2 })
  cantidad: number;

  @Column({ name: 'precio_unitario', type: 'numeric', precision: 12, scale: 2 })
  precioUnitario: number;

  @Column({ name: 'descuento', type: 'numeric', precision: 12, scale: 2, default: 0 })
  descuento: number;

  @Column({ name: 'impuesto_pct', type: 'numeric', precision: 5, scale: 2, default: 0 })
  impuestoPct: number;

  @Column({ name: 'total_linea', type: 'numeric', precision: 12, scale: 2, default: 0 })
  totalLinea: number;

  @Column({ name: 'created_at', type: 'timestamptz', default: () => 'NOW()' })
  createdAt: Date;
}

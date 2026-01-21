import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Factura } from './factura.entity';

@Entity('detalles_factura')
export class DetalleFactura {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'factura_id', type: 'uuid' })
  facturaId: string;

  @ManyToOne(() => Factura, (f) => f.detalles)
  @JoinColumn({ name: 'factura_id' })
  factura: Factura;

  @Column({ name: 'producto_id', type: 'uuid', nullable: true })
  productoId: string | null;

  @Column({ length: 300, nullable: true })
  descripcion: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  cantidad: number | null;

  @Column({ name: 'precio_unitario', type: 'decimal', precision: 12, scale: 2, nullable: true })
  precioUnitario: number | null;

  @Column({ name: 'total_linea', type: 'decimal', precision: 12, scale: 2, nullable: true })
  totalLinea: number | null;
}

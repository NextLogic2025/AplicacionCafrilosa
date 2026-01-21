import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { DetalleFactura } from './detalle-factura.entity';

@Entity('facturas')
export class Factura {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'pedido_id', type: 'uuid' })
  pedidoId: string;

  @Column({ name: 'cliente_id', type: 'uuid' })
  clienteId: string;

  @Column({ name: 'vendedor_id', type: 'uuid', nullable: true })
  vendedorId: string | null;

  @Column({ name: 'ruc_cliente', length: 20 })
  rucCliente: string;

  @Column({ name: 'razon_social_cliente', length: 200 })
  razonSocialCliente: string;

  @CreateDateColumn({ name: 'fecha_emision', type: 'timestamptz' })
  fechaEmision: Date;

  @Column({ name: 'punto_emision_id', type: 'uuid', nullable: true })
  puntoEmisionId: string | null;

  @Column({ name: 'numero_completo', length: 50, nullable: true, unique: true })
  numeroCompleto: string | null;

  @Column({ name: 'clave_acceso_sri', length: 49, nullable: true })
  claveAccesoSri: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  impuestos: number;

  @Column({ name: 'total_final', type: 'decimal', precision: 12, scale: 2 })
  totalFinal: number;

  @Column({ name: 'estado_sri', length: 20, default: 'PENDIENTE' })
  estadoSri: string;

  @Column({ name: 'url_xml', type: 'text', nullable: true })
  urlXml: string | null;

  @Column({ name: 'url_pdf', type: 'text', nullable: true })
  urlPdf: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @OneToMany(() => DetalleFactura, (d) => d.factura, { cascade: true })
  detalles: DetalleFactura[];
}

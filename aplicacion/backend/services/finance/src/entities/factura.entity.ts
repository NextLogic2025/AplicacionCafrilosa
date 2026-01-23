import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { DetalleFactura } from './detalle-factura.entity';

@Entity('factura')
export class Factura {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Column({ name: 'pedido_id', type: 'uuid' })
  pedidoId: string;

  @Column({ name: 'cliente_id', type: 'uuid' })
  clienteId: string;

  @Column({ name: 'vendedor_id', type: 'uuid', nullable: true })
  vendedorId: string | null;

  @Column({ name: 'punto_emision_id', type: 'uuid', nullable: true })
  puntoEmisionId: string | null;

  @CreateDateColumn({ name: 'fecha_emision', type: 'timestamptz' })
  fechaEmision: Date;

  @Column({ name: 'estado', type: 'varchar', length: 20, default: 'BORRADOR' })
  estado: string;

  @Column({ name: 'numero_completo', length: 50, nullable: true, unique: true })
  numeroCompleto: string | null;

  @Column({ name: 'clave_acceso_sri', length: 49, nullable: true })
  claveAccesoSri: string | null;

  @Column({ name: 'estado_sri', type: 'varchar', length: 20, default: 'PENDIENTE' })
  estadoSri: string;

  @Column({ name: 'url_xml', type: 'text', nullable: true })
  urlXml: string | null;

  @Column({ name: 'url_pdf', type: 'text', nullable: true })
  urlPdf: string | null;

  // En la DB estos campos van cifrados (bytea). Guardamos como Buffer.
  @Column({ name: 'ruc_cliente_enc', type: 'bytea' })
  rucClienteEnc: Buffer;

  @Column({ name: 'ruc_cliente_hash', type: 'bytea' })
  rucClienteHash: Buffer;

  @Column({ name: 'razon_social_cliente_enc', type: 'bytea' })
  razonSocialClienteEnc: Buffer;

  @Column({ name: 'subtotal', type: 'numeric', precision: 12, scale: 2, default: 0 })
  subtotal: number;

  @Column({ name: 'impuestos', type: 'numeric', precision: 12, scale: 2, default: 0 })
  impuestos: number;

  @Column({ name: 'total_final', type: 'numeric', precision: 12, scale: 2, default: 0 })
  totalFinal: number;

  @Column({ name: 'created_at', type: 'timestamptz', default: () => 'NOW()' })
  createdAt: Date;

  @Column({ name: 'updated_at', type: 'timestamptz', default: () => 'NOW()' })
  updatedAt: Date;

  @OneToMany(() => DetalleFactura, (d) => d.factura, { cascade: true })
  detalles: DetalleFactura[];
}

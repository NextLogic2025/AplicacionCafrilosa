import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('recibo')
export class ReciboCobro {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'cliente_id', type: 'uuid' })
  clienteId: string;

  @Column({ name: 'vendedor_id', type: 'uuid' })
  vendedorId: string;

  @Column({ name: 'codigo', length: 50, nullable: true })
  codigo: string | null;

  @Column({ name: 'fecha', type: 'timestamptz', default: () => 'NOW()' })
  fecha: Date;

  @Column({ name: 'estado', type: 'varchar', length: 20, default: 'BORRADOR' })
  estado: string;

  @Column({ name: 'observacion', type: 'text', nullable: true })
  observacion: string | null;

  @Column({ name: 'foto_comprobante_url', type: 'text', nullable: true })
  fotoComprobanteUrl: string | null;

  @Column({ name: 'ubicacion_gps', type: 'geometry', spatialFeatureType: 'Point', srid: 4326, nullable: true })
  ubicacionGps: any | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('cobranza_gestion')
export class CobranzaGestion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'cliente_id', type: 'uuid' })
  clienteId: string;

  @Column({ name: 'vendedor_id', type: 'uuid' })
  vendedorId: string;

  @Column({ name: 'fecha', type: 'timestamptz', default: () => 'NOW()' })
  fecha: Date;

  @Column({ name: 'resultado', type: 'varchar', length: 50 })
  resultado: string;

  @Column({ name: 'promesa_pago_fecha', type: 'date', nullable: true })
  promesaPagoFecha: Date | null;

  @Column({ name: 'observacion', type: 'text', nullable: true })
  observacion: string | null;

  @Column({ name: 'ubicacion_gps', type: 'geometry', spatialFeatureType: 'Point', srid: 4326, nullable: true })
  ubicacionGps: any | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}

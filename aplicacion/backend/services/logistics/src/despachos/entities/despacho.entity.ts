import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({ name: 'despachos' })
export class Despacho {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'codigo_manifiesto', type: 'int', nullable: true })
  codigo_manifiesto: number | null;

  @Column({ name: 'vehiculo_id', type: 'uuid', nullable: true })
  vehiculo_id: string | null;

  @Column({ name: 'conductor_id', type: 'uuid', nullable: true })
  conductor_id: string | null;

  @Column({ name: 'estado_viaje', default: 'PLANIFICACION' })
  estado_viaje: string;

  @Column({ name: 'peso_total_kg', type: 'decimal', precision: 12, scale: 2, default: 0 })
  peso_total_kg: string;

  @Column({ name: 'fecha_programada', type: 'date', nullable: true })
  fecha_programada: Date | null;

  @Column({ name: 'hora_inicio_real', type: 'timestamptz', nullable: true })
  hora_inicio_real: Date | null;

  @Column({ name: 'hora_fin_real', type: 'timestamptz', nullable: true })
  hora_fin_real: Date | null;

  @Column({ name: 'observaciones_ruta', type: 'text', nullable: true })
  observaciones_ruta: string | null;

  @Column({ name: 'created_at', type: 'timestamptz', default: () => 'NOW()' })
  created_at: Date;

  @Column({ name: 'updated_at', type: 'timestamptz', default: () => 'NOW()' })
  updated_at: Date;

  @Column({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deleted_at: Date | null;
}

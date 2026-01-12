import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({ name: 'rutero_planificado' })
export class RuteroPlanificado {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'cliente_id', type: 'uuid' })
  cliente_id: string;

  @Column({ name: 'sucursal_id', type: 'uuid', nullable: true })
  sucursal_id: string | null;

  @Column({ name: 'tipo_direccion', type: 'varchar', default: 'PRINCIPAL' })
  tipo_direccion: string;

  @Column({ name: 'zona_id', type: 'int' })
  zona_id: number;

  @Column({ name: 'dia_semana', type: 'int' })
  dia_semana: number;

  @Column({ default: 'SEMANAL' })
  frecuencia: string;

  @Column({ name: 'prioridad_visita', default: 'NORMAL' })
  prioridad_visita: string;

  @Column({ name: 'orden_sugerido', type: 'int', nullable: true })
  orden_sugerido: number | null;

  @Column({ name: 'hora_estimada_arribo', type: 'time', nullable: true })
  hora_estimada_arribo: string | null;

  @Column({ default: true })
  activo: boolean;

  @Column({ name: 'created_at', type: 'timestamptz', default: () => 'NOW()' })
  created_at: Date;

  @Column({ name: 'updated_at', type: 'timestamptz', default: () => 'NOW()' })
  updated_at: Date;
}

import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({ name: 'asignacion_vendedores' })
export class AsignacionVendedores {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'zona_id', type: 'int' })
  zona_id: number;

  @Column({ name: 'vendedor_usuario_id', type: 'uuid' })
  vendedor_usuario_id: string;

  @Column({ name: 'nombre_vendedor_cache', nullable: true })
  nombre_vendedor_cache: string | null;

  @Column({ name: 'fecha_inicio', type: 'date', nullable: true })
  fecha_inicio: string | null;

  @Column({ name: 'fecha_fin', type: 'date', nullable: true })
  fecha_fin: string | null;

  @Column({ name: 'es_principal', default: true })
  es_principal: boolean;

  @Column({ name: 'created_at', type: 'timestamptz', default: () => 'NOW()' })
  created_at: Date;

  @Column({ name: 'updated_at', type: 'timestamptz', default: () => 'NOW()' })
  updated_at: Date;

  @Column({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deleted_at: Date | null;
}

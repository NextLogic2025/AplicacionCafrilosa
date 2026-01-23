import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({ name: 'conductores' })
export class Conductor {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'usuario_id', type: 'uuid', nullable: true, unique: true })
  usuario_id: string | null;

  @Column({ name: 'nombre_completo', length: 150 })
  nombre_completo: string;
  @Column({ length: 20, nullable: true })
  licencia: string | null;

  @Column({ default: true })
  activo: boolean;

  @Column({ name: 'created_at', type: 'timestamptz', default: () => 'NOW()' })
  created_at: Date;

  @Column({ name: 'updated_at', type: 'timestamptz', default: () => 'NOW()' })
  updated_at: Date;

  @Column({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deleted_at: Date | null;
}

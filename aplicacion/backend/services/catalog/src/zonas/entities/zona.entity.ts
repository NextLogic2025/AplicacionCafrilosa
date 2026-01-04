import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({ name: 'zonas_comerciales' })
export class ZonaComercial {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  codigo: string;

  @Column()
  nombre: string;

  @Column({ nullable: true })
  ciudad: string | null;

  @Column({ nullable: true })
  macrorregion: string | null;

  @Column({ name: 'poligono_geografico', type: 'geometry', nullable: true })
  poligono_geografico: any | null;

  @Column({ default: true })
  activo: boolean;

  @Column({ name: 'created_at', type: 'timestamptz', default: () => 'NOW()' })
  created_at: Date;

  @Column({ name: 'updated_at', type: 'timestamptz', default: () => 'NOW()' })
  updated_at: Date;

  @Column({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deleted_at: Date | null;
}

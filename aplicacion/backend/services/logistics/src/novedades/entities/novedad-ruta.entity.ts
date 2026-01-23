import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({ name: 'novedades_ruta' })
export class NovedadRuta {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'despacho_id', type: 'uuid', nullable: true })
  despacho_id: string | null;

  @Column({ name: 'entrega_id', type: 'uuid', nullable: true })
  entrega_id: string | null;

  @Column({ length: 50, nullable: true })
  motivo: string | null;

  @Column({ type: 'text', nullable: true })
  descripcion: string | null;

  @Column({ name: 'foto_url', type: 'text', nullable: true })
  foto_url: string | null;

  @Column({ name: 'reportado_at', type: 'timestamptz', default: () => 'NOW()' })
  reportado_at: Date;
}

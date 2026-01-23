import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({ name: 'pruebas_entrega' })
export class PruebaEntrega {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'entrega_id', type: 'uuid', unique: true })
  entrega_id: string;

  @Column({ name: 'nombre_receptor', length: 150, nullable: true })
  nombre_receptor: string | null;

  @Column({ name: 'documento_receptor', length: 20, nullable: true })
  documento_receptor: string | null;

  @Column({ name: 'firma_url', type: 'text', nullable: true })
  firma_url: string | null;

  @Column({ name: 'foto_evidencia_url', type: 'text', nullable: true })
  foto_evidencia_url: string | null;

  @Column({ name: 'ubicacion_confirmacion', type: 'geometry', nullable: true })
  ubicacion_confirmacion: any | null;

  @Column({ name: 'fecha_confirmacion', type: 'timestamptz', nullable: true })
  fecha_confirmacion: Date | null;

  @Column({ name: 'created_at', type: 'timestamptz', default: () => 'NOW()' })
  created_at: Date;
}

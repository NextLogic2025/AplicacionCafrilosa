import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({ name: 'campañas_promocionales' })
export class CampaniaPromocional {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nombre: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string | null;

  @Column({ name: 'fecha_inicio', type: 'timestamptz' })
  fecha_inicio: Date;

  @Column({ name: 'fecha_fin', type: 'timestamptz' })
  fecha_fin: Date;

  @Column({ name: 'tipo_descuento', nullable: true })
  tipo_descuento: string | null;

  @Column({ name: 'valor_descuento', type: 'decimal', precision: 10, scale: 2, nullable: true })
  valor_descuento: string | null;

  @Column({ name: 'imagen_banner_url', type: 'text', nullable: true })
  imagen_banner_url: string | null;

  @Column({ default: true })
  activo: boolean;

  @Column({ name: 'created_at', type: 'timestamptz', default: () => 'NOW()' })
  created_at: Date;

  @Column({ name: 'updated_at', type: 'timestamptz', default: () => 'NOW()' })
  updated_at: Date;

  @Column({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deleted_at: Date | null;
}

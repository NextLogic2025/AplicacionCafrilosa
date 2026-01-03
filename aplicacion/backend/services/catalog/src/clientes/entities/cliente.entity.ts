import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({ name: 'clientes' })
export class Cliente {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'usuario_principal_id', type: 'uuid', nullable: true })
  usuario_principal_id: string | null;

  @Column({ unique: true })
  identificacion: string;

  @Column({ name: 'tipo_identificacion', default: 'RUC' })
  tipo_identificacion: string;

  @Column({ name: 'razon_social' })
  razon_social: string;

  @Column({ name: 'nombre_comercial', nullable: true })
  nombre_comercial: string | null;

  @Column({ name: 'lista_precios_id', type: 'int', nullable: true })
  lista_precios_id: number | null;

  @Column({ name: 'vendedor_asignado_id', type: 'uuid', nullable: true })
  vendedor_asignado_id: string | null;

  @Column({ name: 'zona_comercial_id', type: 'int', nullable: true })
  zona_comercial_id: number | null;

  @Column({ name: 'tiene_credito', default: false })
  tiene_credito: boolean;

  @Column({ name: 'limite_credito', type: 'decimal', precision: 12, scale: 2, default: 0 })
  limite_credito: string;

  @Column({ name: 'saldo_actual', type: 'decimal', precision: 12, scale: 2, default: 0 })
  saldo_actual: string;

  @Column({ name: 'dias_plazo', type: 'int', default: 0 })
  dias_plazo: number;

  @Column({ default: false })
  bloqueado: boolean;

  @Column({ name: 'direccion_texto', type: 'text', nullable: true })
  direccion_texto: string | null;

  @Column({ name: 'ubicacion_gps', type: 'geometry', nullable: true })
  ubicacion_gps: any | null;

  @Column({ name: 'created_at', type: 'timestamptz', default: () => 'NOW()' })
  created_at: Date;

  @Column({ name: 'updated_at', type: 'timestamptz', default: () => 'NOW()' })
  updated_at: Date;

  @Column({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deleted_at: Date | null;
}

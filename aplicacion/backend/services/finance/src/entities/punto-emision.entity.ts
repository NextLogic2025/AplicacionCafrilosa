import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';

@Index(['codigoEstablecimiento', 'codigoPuntoEmision'], { unique: true })
@Entity('punto_emision')
export class PuntoEmision {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'codigo_establecimiento', length: 10 })
  codigoEstablecimiento: string;

  @Column({ name: 'codigo_punto_emision', length: 10 })
  codigoPuntoEmision: string;

  @Column({ name: 'secuencia_actual', type: 'bigint', default: 1 })
  secuenciaActual: number;

  @Column({ default: true })
  activo: boolean;

  @Column({ name: 'created_at', type: 'timestamptz', default: () => 'NOW()' })
  createdAt: Date;

  @Column({ name: 'updated_at', type: 'timestamptz', default: () => 'NOW()' })
  updatedAt: Date;
}

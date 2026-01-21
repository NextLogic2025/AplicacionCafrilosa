import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('puntos_emision')
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
}

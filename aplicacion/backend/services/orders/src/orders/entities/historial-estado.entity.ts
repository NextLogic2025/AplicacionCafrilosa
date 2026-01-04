import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('historial_estados')
export class HistorialEstado {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'uuid' })
  pedido_id: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  estado_anterior: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  estado_nuevo: string | null;

  @Column({ type: 'uuid', nullable: true })
  usuario_responsable_id: string | null;

  @Column({ type: 'text', nullable: true })
  motivo_cambio: string | null;

  @Column({ type: 'timestamptz', default: () => 'NOW()' })
  fecha_cambio: Date;
}

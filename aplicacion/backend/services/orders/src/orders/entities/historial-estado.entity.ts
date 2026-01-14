import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Pedido } from './pedido.entity';

@Entity('historial_estados')
export class HistorialEstado {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'uuid' })
  pedido_id: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  estado_anterior: string;

  @Column({ type: 'varchar', length: 20 })
  estado_nuevo: string;

  @Column({ type: 'text', nullable: true, name: 'motivo_cambio' })
  comentario: string;

  @Column({ type: 'uuid', nullable: true, name: 'usuario_responsable_id' })
  usuario_id: string;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  fecha_cambio: Date;

  @ManyToOne(() => Pedido, (pedido) => pedido.id)
  @JoinColumn({ name: 'pedido_id' })
  pedido: Pedido;
}
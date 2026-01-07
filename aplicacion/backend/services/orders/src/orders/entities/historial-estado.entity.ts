import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Pedido } from './pedido.entity';

@Entity('historial_estados')
export class HistorialEstado {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  pedido_id: string;

  @Column({ type: 'varchar', length: 20 })
  estado_anterior: string;

  @Column({ type: 'varchar', length: 20 })
  estado_nuevo: string;

  @Column({ type: 'text', nullable: true })
  comentario: string;

  @Column({ type: 'uuid', nullable: true })
  usuario_id: string; // Quién hizo el cambio (Admin/Bodeguero)

  @CreateDateColumn({ type: 'timestamp with time zone' })
  fecha_cambio: Date;

  @ManyToOne(() => Pedido, (pedido) => pedido.id)
  @JoinColumn({ name: 'pedido_id' })
  pedido: Pedido;
}
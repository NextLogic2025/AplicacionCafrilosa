import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Pedido } from './pedido.entity';
import { DetallePedido } from './detalle-pedido.entity';

@Entity('promociones_aplicadas')
export class PromocionAplicada {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  pedido_id: string;

  @Column({ type: 'uuid', nullable: true })
  detalle_pedido_id: string;

  @Column({ type: 'int', nullable: true })
  campaña_id: number;

  @Column({ type: 'varchar', length: 20, nullable: true })
  tipo_descuento: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  valor_descuento: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  monto_aplicado: number;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @ManyToOne(() => Pedido, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pedido_id' })
  pedido: Pedido;

  @ManyToOne(() => DetallePedido, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'detalle_pedido_id' })
  detalle: DetallePedido;
}

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('recibo_pago')
export class ReciboPago {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'recibo_id', type: 'uuid' })
  reciboId: string;

  @Column({ name: 'forma', type: 'varchar', length: 30 })
  forma: string;

  @Column({ name: 'monto', type: 'numeric', precision: 12, scale: 2 })
  monto: number;

  @Column({ name: 'referencia', type: 'varchar', length: 120, nullable: true })
  referencia: string | null;

  @Column({ name: 'conciliacion_estado', type: 'varchar', length: 20, default: 'PENDIENTE' })
  conciliacionEstado: string;

  @Column({ name: 'conciliado_at', type: 'timestamptz', nullable: true })
  conciliadoAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}

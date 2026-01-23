import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('cliente_credito_movimiento')
export class ClienteCreditoMovimiento {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'cliente_id', type: 'uuid' })
  clienteId: string;

  @Column({ name: 'referencia_tipo', length: 30 })
  referenciaTipo: string;

  @Column({ name: 'referencia_id', type: 'uuid', nullable: true })
  referenciaId: string | null;

  @Column({ name: 'motivo', type: 'varchar', length: 50 })
  motivo: string;

  @Column({ name: 'monto', type: 'numeric', precision: 12, scale: 2 })
  monto: number;

  @Column({ name: 'expiracion', type: 'date', nullable: true })
  expiracion: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}

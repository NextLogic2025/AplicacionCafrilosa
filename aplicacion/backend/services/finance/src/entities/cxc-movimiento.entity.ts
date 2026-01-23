import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('cxc_movimiento')
export class CxcMovimiento {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'cuenta_por_cobrar_id', type: 'uuid' })
  cuentaPorCobrarId: string;

  @Column({ name: 'monto', type: 'numeric', precision: 12, scale: 2 })
  monto: number;

  @Column({ name: 'referencia_tipo', length: 30 })
  referenciaTipo: string;

  @Column({ name: 'referencia_id', type: 'uuid', nullable: true })
  referenciaId: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}

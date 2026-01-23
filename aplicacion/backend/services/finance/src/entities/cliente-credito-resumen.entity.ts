import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('cliente_credito_resumen')
export class ClienteCreditoResumen {
  @PrimaryColumn({ name: 'cliente_id', type: 'uuid' })
  clienteId: string;

  @Column({ name: 'saldo', type: 'numeric', precision: 12, scale: 2, default: 0 })
  saldo: number;

  @Column({ name: 'updated_at', type: 'timestamptz', default: () => 'NOW()' })
  updatedAt: Date;
}

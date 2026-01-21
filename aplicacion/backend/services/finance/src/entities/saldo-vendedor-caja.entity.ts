import { Entity, PrimaryColumn, Column, UpdateDateColumn } from 'typeorm';

@Entity('saldo_vendedor_caja')
export class SaldoVendedorCaja {
  @PrimaryColumn({ name: 'vendedor_usuario_id', type: 'uuid' })
  vendedorUsuarioId: string;

  @Column({ name: 'saldo_efectivo_mano', type: 'decimal', precision: 12, scale: 2, default: 0 })
  saldoEfectivoMano: number;

  @Column({ name: 'saldo_cheques_mano', type: 'decimal', precision: 12, scale: 2, default: 0 })
  saldoChequesMano: number;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}

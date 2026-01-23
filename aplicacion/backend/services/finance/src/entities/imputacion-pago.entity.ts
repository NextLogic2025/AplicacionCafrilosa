import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('pago_aplicacion')
export class ImputacionPago {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'recibo_id', type: 'uuid' })
  reciboId: string;

  @Column({ name: 'cuenta_por_cobrar_id', type: 'uuid' })
  cuentaPorCobrarId: string;

  @Column({ name: 'monto_aplicado', type: 'numeric', precision: 12, scale: 2 })
  montoAplicado: number;

  @Column({ name: 'estado', type: 'varchar', length: 20, default: 'ACTIVA' })
  estado: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}

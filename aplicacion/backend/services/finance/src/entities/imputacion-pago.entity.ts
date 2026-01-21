import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('imputaciones_pago')
export class ImputacionPago {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'recibo_id', type: 'uuid' })
  reciboId: string;

  @Column({ name: 'cuota_id', type: 'uuid' })
  cuotaId: string;

  @Column({ name: 'monto_aplicado', type: 'decimal', precision: 12, scale: 2 })
  montoAplicado: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}

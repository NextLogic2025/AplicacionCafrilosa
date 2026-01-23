import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('nota_credito')
export class NotaCredito {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'cliente_id', type: 'uuid' })
  clienteId: string;

  @Column({ name: 'factura_id', type: 'uuid', nullable: true })
  facturaId: string | null;

  @Column({ name: 'fecha', type: 'timestamptz', default: () => 'NOW()' })
  fecha: Date;

  @Column({ name: 'motivo', type: 'text' })
  motivo: string;

  @Column({ name: 'subtotal', type: 'numeric', precision: 12, scale: 2, default: 0 })
  subtotal: number;

  @Column({ name: 'impuestos', type: 'numeric', precision: 12, scale: 2, default: 0 })
  impuestos: number;

  @Column({ name: 'total', type: 'numeric', precision: 12, scale: 2, default: 0 })
  total: number;

  @Column({ name: 'estado', type: 'varchar', length: 20, default: 'EMITIDA' })
  estado: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}

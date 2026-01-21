import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('cuentas_por_cobrar')
export class CuentaPorCobrar {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'cliente_id', type: 'uuid' })
  clienteId: string;

  @Column({ name: 'factura_id', type: 'uuid', nullable: true })
  facturaId: string | null;

  @Column({ name: 'numero_cuota', type: 'int', default: 1 })
  numeroCuota: number;

  @Column({ name: 'fecha_vencimiento', type: 'date' })
  fechaVencimiento: Date;

  @Column({ name: 'monto_original', type: 'decimal', precision: 12, scale: 2 })
  montoOriginal: number;

  @Column({ name: 'monto_pagado', type: 'decimal', precision: 12, scale: 2, default: 0 })
  montoPagado: number;

  @Column({ name: 'estado', length: 20, default: 'PENDIENTE' })
  estado: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}

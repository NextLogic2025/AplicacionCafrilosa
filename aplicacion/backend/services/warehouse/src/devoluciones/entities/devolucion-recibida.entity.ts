// devoluciones/entities/devolucion-recibida.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { PickingOrden } from '../../picking/entities/picking-orden.entity';
import { Lote } from '../../lotes/entities/lote.entity';

@Entity('devoluciones_recibidas')
export class DevolucionRecibida {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'nota_credito_id', type: 'uuid', nullable: true })
    notaCreditoId: string;

    @Column({ name: 'pedido_origen_id', type: 'uuid', nullable: true })
    pedidoOrigenId: string;

    @Column({ name: 'picking_id', type: 'uuid', nullable: true })
    pickingId: string;

    @ManyToOne(() => PickingOrden, { nullable: true })
    @JoinColumn({ name: 'picking_id' })
    picking: PickingOrden;

    @Column({ name: 'lote_id', type: 'uuid', nullable: true })
    loteId: string;

    @ManyToOne(() => Lote, { nullable: true })
    @JoinColumn({ name: 'lote_id' })
    lote: Lote;

    @Column({ name: 'cantidad_recibida', type: 'decimal', precision: 12, scale: 2 })
    cantidadRecibida: number;

    @Column({ name: 'estado_producto', length: 20, default: 'BUENO' })
    estadoProducto: string;

    @Column({ name: 'decision_inventario', length: 20, nullable: true })
    decisionInventario: string;

    @Column({ type: 'text', nullable: true })
    observaciones: string;

    @Column({ name: 'fecha_recepcion', type: 'timestamptz', default: () => 'NOW()' })
    fechaRecepcion: Date;

    @Column({ name: 'usuario_recibio', type: 'uuid', nullable: true })
    usuarioRecibio: string;

    @Column({ name: 'created_at', type: 'timestamptz', default: () => 'NOW()' })
    createdAt: Date;

    @Column({ name: 'updated_at', type: 'timestamptz', default: () => 'NOW()' })
    updatedAt: Date;

    @Column({ name: 'deleted_at', type: 'timestamptz', nullable: true })
    deletedAt: Date;
}
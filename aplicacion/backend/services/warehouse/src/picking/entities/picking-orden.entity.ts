// picking/entities/picking-orden.entity.ts
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('picking_ordenes')
export class PickingOrden {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'pedido_id', type: 'uuid', unique: true })
    pedidoId: string;

    @Column({ name: 'reservation_id', type: 'uuid', nullable: true })
    reservationId?: string;

    @Column({ name: 'bodeguero_asignado_id', type: 'uuid', nullable: true })
    bodegueroAsignadoId: string;

    @Column({ type: 'int', default: 1 })
    prioridad: number;

    @Column({ length: 20, default: 'ASIGNADO' })
    estado: string;

    @Column({ name: 'fecha_inicio', type: 'timestamptz', nullable: true })
    fechaInicio: Date;

    @Column({ name: 'fecha_fin', type: 'timestamptz', nullable: true })
    fechaFin: Date;

    @Column({ name: 'observaciones_bodega', type: 'text', nullable: true })
    observacionesBodega: string;

    @Column({ name: 'created_at', type: 'timestamptz', default: () => 'NOW()' })
    createdAt: Date;

    @Column({ name: 'updated_at', type: 'timestamptz', default: () => 'NOW()' })
    updatedAt: Date;

    @Column({ name: 'deleted_at', type: 'timestamptz', nullable: true })
    deletedAt: Date;
}
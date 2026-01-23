// picking/entities/picking-item.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { PickingOrden } from './picking-orden.entity';
import { Ubicacion } from '../../ubicaciones/entities/ubicacion.entity';
import { Lote } from '../../lotes/entities/lote.entity';

@Entity('picking_items')
export class PickingItem {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'picking_id', type: 'uuid' })
    pickingId: string;

    @ManyToOne(() => PickingOrden, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'picking_id' })
    pickingOrden: PickingOrden;

    @Column({ name: 'producto_id', type: 'uuid' })
    productoId: string;

    @Column({ name: 'cantidad_solicitada', type: 'decimal', precision: 12, scale: 2 })
    cantidadSolicitada: number;

    @Column({ name: 'ubicacion_origen_sugerida', type: 'uuid', nullable: true })
    ubicacionOrigenSugerida: string;

    @ManyToOne(() => Ubicacion, { nullable: true })
    @JoinColumn({ name: 'ubicacion_origen_sugerida' })
    ubicacionSugerida: Ubicacion;

    @Column({ name: 'lote_sugerido', type: 'uuid', nullable: true })
    loteSugerido: string;

    @ManyToOne(() => Lote, { nullable: true })
    @JoinColumn({ name: 'lote_sugerido' })
    lote: Lote;

    @Column({ name: 'cantidad_pickeada', type: 'decimal', precision: 12, scale: 2, default: 0 })
    cantidadPickeada: number;

    @Column({ name: 'lote_confirmado', type: 'uuid', nullable: true })
    loteConfirmado: string;

    @Column({ name: 'estado_linea', length: 20, default: 'PENDIENTE' })
    estadoLinea: string;

    @Column({ name: 'motivo_desviacion', type: 'varchar', length: 50, nullable: true })
    motivoDesviacion: string | null;

    @Column({ name: 'notas_bodeguero', type: 'text', nullable: true })
    notasBodeguero: string | null;

    @Column({ name: 'created_at', type: 'timestamptz', default: () => 'NOW()' })
    createdAt: Date;

    @Column({ name: 'updated_at', type: 'timestamptz', default: () => 'NOW()' })
    updatedAt: Date;
}
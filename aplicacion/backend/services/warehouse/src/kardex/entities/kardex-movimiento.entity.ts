// kardex/entities/kardex-movimiento.entity.ts
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('kardex_movimientos')
export class KardexMovimiento {
    @PrimaryGeneratedColumn('increment')
    id: number;

    @Column({ type: 'timestamptz', default: () => 'NOW()' })
    fecha: Date;

    @Column({ name: 'tipo_movimiento', length: 30 })
    tipoMovimiento: string;

    @Column({ name: 'referencia_doc_uuid', type: 'uuid', nullable: true })
    referenciaDocUuid: string;

    @Column({ name: 'producto_id', type: 'uuid' })
    productoId: string;

    @Column({ name: 'lote_id', type: 'uuid', nullable: true })
    loteId: string;

    @Column({ name: 'ubicacion_origen', type: 'uuid', nullable: true })
    ubicacionOrigen: string;

    @Column({ name: 'ubicacion_destino', type: 'uuid', nullable: true })
    ubicacionDestino: string;

    @Column({ type: 'decimal', precision: 12, scale: 2 })
    cantidad: number;

    @Column({ name: 'saldo_resultante', type: 'decimal', precision: 12, scale: 2, nullable: true })
    saldoResultante: number;

    @Column({ name: 'usuario_responsable_id', type: 'uuid', nullable: true })
    usuarioResponsableId: string;

    @Column({ name: 'costo_unitario', type: 'decimal', precision: 12, scale: 4, nullable: true })
    costoUnitario: number;

    @Column({ name: 'created_at', type: 'timestamptz', default: () => 'NOW()' })
    createdAt: Date;
}
// stock/entities/stock-ubicacion.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Ubicacion } from '../../ubicaciones/entities/ubicacion.entity';
import { Lote } from '../../lotes/entities/lote.entity';

@Entity('stock_ubicacion')
export class StockUbicacion {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'ubicacion_id', type: 'uuid' })
    ubicacionId: string;

    @ManyToOne(() => Ubicacion)
    @JoinColumn({ name: 'ubicacion_id' })
    ubicacion: Ubicacion;

    @Column({ name: 'lote_id', type: 'uuid' })
    loteId: string;

    @ManyToOne(() => Lote)
    @JoinColumn({ name: 'lote_id' })
    lote: Lote;

    @Column({ name: 'cantidad_fisica', type: 'decimal', precision: 12, scale: 2 })
    cantidadFisica: number;

    @Column({ name: 'cantidad_reservada', type: 'decimal', precision: 12, scale: 2, default: 0 })
    cantidadReservada: number;

    @Column({ name: 'ultima_entrada', type: 'timestamptz', default: () => 'NOW()' })
    ultimaEntrada: Date;

    @Column({ name: 'created_at', type: 'timestamptz', default: () => 'NOW()' })
    createdAt: Date;

    @Column({ name: 'updated_at', type: 'timestamptz', default: () => 'NOW()' })
    updatedAt: Date;
}
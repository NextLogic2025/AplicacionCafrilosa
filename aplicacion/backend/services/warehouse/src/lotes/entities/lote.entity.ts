// lotes/entities/lote.entity.ts
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('lotes')
export class Lote {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'producto_id', type: 'uuid' })
    productoId: string;

    @Column({ name: 'numero_lote', length: 50 })
    numeroLote: string;

    @Column({ name: 'fecha_fabricacion', type: 'date' })
    fechaFabricacion: Date;

    @Column({ name: 'fecha_vencimiento', type: 'date' })
    fechaVencimiento: Date;

    @Column({ name: 'estado_calidad', length: 20, default: 'LIBERADO' })
    estadoCalidad: string;

    @Column({ name: 'created_at', type: 'timestamptz', default: () => 'NOW()' })
    createdAt: Date;

    @Column({ name: 'updated_at', type: 'timestamptz', default: () => 'NOW()' })
    updatedAt: Date;
}
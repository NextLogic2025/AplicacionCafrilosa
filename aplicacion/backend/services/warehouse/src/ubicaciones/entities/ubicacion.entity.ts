// ubicaciones/entities/ubicacion.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Almacen } from '../../almacenes/entities/almacen.entity';

@Entity('ubicaciones')
export class Ubicacion {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'almacen_id', type: 'int' })
    almacenId: number;

    @ManyToOne(() => Almacen)
    @JoinColumn({ name: 'almacen_id' })
    almacen: Almacen;

    @Column({ name: 'codigo_visual', length: 20 })
    codigoVisual: string;

    @Column({ length: 20, default: 'RACK' })
    tipo: string;

    @Column({ name: 'capacidad_max_kg', type: 'decimal', precision: 10, scale: 2, nullable: true })
    capacidadMaxKg: number;

    @Column({ name: 'es_cuarentena', default: false })
    esCuarentena: boolean;

    @Column({ name: 'created_at', type: 'timestamptz', default: () => 'NOW()' })
    createdAt: Date;

    @Column({ name: 'updated_at', type: 'timestamptz', default: () => 'NOW()' })
    updatedAt: Date;
}
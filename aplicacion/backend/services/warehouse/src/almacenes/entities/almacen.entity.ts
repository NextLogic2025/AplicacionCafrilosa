// almacenes/entities/almacen.entity.ts
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('almacenes')
export class Almacen {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 50 })
    nombre: string;

    @Column({ name: 'codigo_ref', length: 10, unique: true, nullable: true })
    codigoRef: string;

    @Column({ name: 'requiere_frio', default: false })
    requiereFrio: boolean;

    @Column({ name: 'direccion_fisica', type: 'text', nullable: true })
    direccionFisica: string;

    @Column({ default: true })
    activo: boolean;

    @Column({ name: 'created_at', type: 'timestamptz', default: () => 'NOW()' })
    createdAt: Date;

    @Column({ name: 'updated_at', type: 'timestamptz', default: () => 'NOW()' })
    updatedAt: Date;
}

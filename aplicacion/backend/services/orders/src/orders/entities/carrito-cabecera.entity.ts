import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { CarritoItem } from './carrito-item.entity';

@Entity('carritos_cabecera')
export class CarritoCabecera {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid', unique: true })
    usuario_id: string;

    @CreateDateColumn({ type: 'timestamp with time zone', name: 'created_at' })
    fecha_creacion: Date;

    @UpdateDateColumn({ type: 'timestamp with time zone', name: 'updated_at' })
    fecha_actualizacion: Date;

    @OneToMany(() => CarritoItem, (item) => item.carrito, { cascade: true })
    items: CarritoItem[];
}
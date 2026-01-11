import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { CarritoItem } from './carrito-item.entity';

@Entity('carritos_cabecera')
export class CarritoCabecera {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    usuario_id: string;

    @Column({ name: 'cliente_id', type: 'uuid', nullable: true })
    cliente_id: string | null;

    @CreateDateColumn({ type: 'timestamp with time zone' })
    fecha_creacion: Date;

    @UpdateDateColumn({ type: 'timestamp with time zone' })
    fecha_actualizacion: Date;

    @Column({ name: 'deleted_at', type: 'timestamptz', nullable: true })
    deleted_at?: Date | null;

    @OneToMany(() => CarritoItem, (item) => item.carrito, { cascade: true })
    items: CarritoItem[];
}
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';

import { PrecioItem } from './precio.entity';

@Entity('listas_precios')
export class ListaPrecio {
  @PrimaryGeneratedColumn()
  id: number; // 1=General, 2=Mayorista, 3=Horeca

  @Column()
  nombre: string;

  @Column({ default: true })
  activa: boolean;

  @Column({ default: 'USD' })
  moneda: string;

  @OneToMany(() => PrecioItem, (p) => p.lista)
  precios: PrecioItem[];
}
import { Entity, Column, ManyToOne, JoinColumn, PrimaryColumn } from 'typeorm';

import { Product } from '../../products/entities/product.entity';

import { ListaPrecio } from './lista-precio.entity';

@Entity('precios_items')
export class PrecioItem {
  @PrimaryColumn({ name: 'lista_id', type: 'int' })
  lista_id: number;

  @PrimaryColumn({ name: 'producto_id', type: 'uuid' })
  producto_id: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  precio: number;

  @ManyToOne(() => ListaPrecio)
  @JoinColumn({ name: 'lista_id' })
  lista: ListaPrecio;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'producto_id' })
  producto: Product;
}

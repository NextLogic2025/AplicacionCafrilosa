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

  // RELACIONES
  // eager: false para no traerlas automáticamente a menos que se pida
  @ManyToOne(() => ListaPrecio, (lista) => lista.precios, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'lista_id' })
  lista: ListaPrecio;

  @ManyToOne(() => Product, (producto) => producto.precios, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'producto_id' })
  producto: Product;
}
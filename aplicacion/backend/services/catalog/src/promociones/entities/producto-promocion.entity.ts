import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm';

import { Product } from '../../products/entities/product.entity';

import { CampaniaPromocional } from './campania.entity';

@Entity({ name: 'productos_promocion' })
export class ProductoPromocion {
  @PrimaryColumn({ name: 'campaña_id', type: 'int' })
  campania_id: number;

  @PrimaryColumn({ name: 'producto_id', type: 'uuid' })
  producto_id: string;

  @Column({ name: 'precio_oferta_fijo', type: 'decimal', precision: 10, scale: 2, nullable: true })
  precio_oferta_fijo: string | null;

  @ManyToOne(() => CampaniaPromocional)
  @JoinColumn({ name: 'campaña_id' })
  campania: CampaniaPromocional;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'producto_id' })
  producto: Product;
}

import { Column, Entity, PrimaryGeneratedColumn, DeleteDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';

import { Category } from '../../categories/entities/category.entity';
import { PrecioItem } from '../../precios/entities/precio.entity';
import { ProductoPromocion } from '../../promociones/entities/producto-promocion.entity';

@Entity({ name: 'productos' })
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'codigo_sku', unique: true })
  codigoSku: string; // CamelCase en propiedad, snake_case en DB

  @Column()
  nombre: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column({ name: 'categoria_id', type: 'int', nullable: true })
  categoriaId: number;

  @ManyToOne(() => Category, { eager: false })
  @JoinColumn({ name: 'categoria_id' })
  categoria: Category;

  @Column({ name: 'peso_unitario_kg', type: 'decimal', precision: 10, scale: 3 })
  pesoUnitarioKg: number; // TypeORM puede mapear decimal a number si se configura, sino string

  @Column({ name: 'volumen_m3', type: 'decimal', precision: 10, scale: 4, nullable: true })
  volumenM3: number;

  @Column({ name: 'requiere_frio', default: false })
  requiereFrio: boolean;

  @Column({ name: 'unidad_medida', default: 'UNIDAD' })
  unidadMedida: string;

  @Column({ name: 'imagen_url', type: 'text', nullable: true })
  imagenUrl: string;

  @Column({ default: true })
  activo: boolean;

  @OneToMany(() => PrecioItem, (precio) => precio.producto)
  precios: PrecioItem[];

  @OneToMany(() => ProductoPromocion, (promo) => promo.producto)
  promociones: ProductoPromocion[];

  @Column({ name: 'created_at', type: 'timestamptz', default: () => 'NOW()' })
  createdAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', select: false })
  deletedAt: Date;
}
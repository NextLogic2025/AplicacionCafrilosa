import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'productos' })
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'codigo_sku', unique: true })
  codigo_sku: string;

  @Column()
  nombre: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column({ name: 'categoria_id', type: 'int', nullable: true })
  categoria_id: number;

  @Column({ name: 'peso_unitario_kg', type: 'decimal', precision: 10, scale: 3 })
  peso_unitario_kg: string;

  @Column({ name: 'volumen_m3', type: 'decimal', precision: 10, scale: 4, nullable: true })
  volumen_m3: string;

  @Column({ name: 'requiere_frio', default: false })
  requiere_frio: boolean;

  @Column({ name: 'unidad_medida', default: 'UNIDAD' })
  unidad_medida: string;

  @Column({ name: 'imagen_url', type: 'text', nullable: true })
  imagen_url: string;

  @Column({ default: true })
  activo: boolean;

  @Column({ name: 'created_at', type: 'timestamptz', default: () => 'NOW()' })
  created_at: Date;

  @Column({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deleted_at: Date | null;
}

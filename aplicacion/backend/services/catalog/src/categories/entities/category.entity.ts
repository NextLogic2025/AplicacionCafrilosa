import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity({ name: 'categorias' })
export class Category {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 'Lácteos' })
  @Column({ length: 50 })
  nombre: string;

  @ApiProperty({ example: 'Productos frescos', nullable: true })
  @Column({ length: 150, nullable: true })
  descripcion: string;

  @ApiProperty({ nullable: true })
  @Column({ type: 'text', nullable: true })
  imagen_url: string;

  @ApiProperty({ example: true })
  @Column({ default: true })
  activo: boolean;

  @Column({ name: 'created_at', type: 'timestamptz', default: () => 'NOW()' })
  created_at: Date;

  @Column({ name: 'updated_at', type: 'timestamptz', default: () => 'NOW()' })
  updated_at: Date;

  @Column({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deleted_at: Date | null;
}
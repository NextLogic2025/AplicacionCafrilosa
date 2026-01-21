import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity({ name: 'sucursales_cliente' })
export class SucursalCliente {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column({ name: 'cliente_id', type: 'uuid' })
  cliente_id: string;

  @ApiProperty({ nullable: true })
  @Column({ name: 'zona_id', type: 'int', nullable: true })
  zona_id: number | null;

  @ApiProperty()
  @Column({ name: 'nombre_sucursal' })
  nombre_sucursal: string;

  @ApiProperty({ nullable: true })
  @Column({ name: 'direccion_entrega', type: 'text', nullable: true })
  direccion_entrega: string | null;

  @ApiProperty({ description: 'GeoJSON Point', nullable: true })
  @Column({ name: 'ubicacion_gps', type: 'geometry', nullable: true })
  ubicacion_gps: any | null;

  @ApiProperty({ nullable: true })
  @Column({ name: 'contacto_nombre', nullable: true })
  contacto_nombre: string | null;

  @ApiProperty({ nullable: true })
  @Column({ name: 'contacto_telefono', nullable: true })
  contacto_telefono: string | null;

  @ApiProperty()
  @Column({ default: true })
  activo: boolean;

  @Column({ name: 'created_at', type: 'timestamptz', default: () => 'NOW()' })
  created_at: Date;

  @Column({ name: 'updated_at', type: 'timestamptz', default: () => 'NOW()' })
  updated_at: Date;

  @Column({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deleted_at: Date | null;
  
  // Campo virtual para enriquecimiento (no en DB)
  @ApiProperty({ required: false })
  zona_nombre?: string;
}

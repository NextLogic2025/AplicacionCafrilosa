import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity({ name: 'clientes' })
export class Cliente {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'UUID del usuario login asociado', nullable: true })
  @Column({ name: 'usuario_principal_id', type: 'uuid', nullable: true })
  usuario_principal_id: string | null;

  @ApiProperty({ example: '1104567890001' })
  @Column({ unique: true })
  identificacion: string;

  @ApiProperty({ default: 'RUC' })
  @Column({ name: 'tipo_identificacion', default: 'RUC' })
  tipo_identificacion: string;

  @ApiProperty()
  @Column({ name: 'razon_social' })
  razon_social: string;

  @ApiProperty({ nullable: true })
  @Column({ name: 'nombre_comercial', nullable: true })
  nombre_comercial: string | null;

  @ApiProperty({ description: 'ID Lista de precios asignada', nullable: true })
  @Column({ name: 'lista_precios_id', type: 'int', nullable: true })
  lista_precios_id: number | null;

  @ApiProperty({ description: 'Vendedor asignado automáticamente', nullable: true })
  @Column({ name: 'vendedor_asignado_id', type: 'uuid', nullable: true })
  vendedor_asignado_id: string | null;

  @ApiProperty({ nullable: true })
  @Column({ name: 'zona_comercial_id', type: 'int', nullable: true })
  zona_comercial_id: number | null;

  // Financiero
  @ApiProperty()
  @Column({ name: 'tiene_credito', default: false })
  tiene_credito: boolean;

  @ApiProperty()
  @Column({ name: 'limite_credito', type: 'decimal', precision: 12, scale: 2, default: 0 })
  limite_credito: string;

  @ApiProperty()
  @Column({ name: 'saldo_actual', type: 'decimal', precision: 12, scale: 2, default: 0 })
  saldo_actual: string;

  @ApiProperty()
  @Column({ name: 'dias_plazo', type: 'int', default: 0 })
  dias_plazo: number;

  @ApiProperty()
  @Column({ default: false })
  bloqueado: boolean;

  @ApiProperty({ nullable: true })
  @Column({ name: 'direccion_texto', type: 'text', nullable: true })
  direccion_texto: string | null;

  // GeoJSON para mapas
  @ApiProperty({ description: 'Coordenadas GPS', nullable: true })
  @Column({ name: 'ubicacion_gps', type: 'geometry', nullable: true })
  ubicacion_gps: any | null;

  @Column({ name: 'created_at', type: 'timestamptz', default: () => 'NOW()' })
  created_at: Date;

  @Column({ name: 'updated_at', type: 'timestamptz', default: () => 'NOW()' })
  updated_at: Date;

  @Column({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deleted_at: Date | null;
}

import { IsInt, IsUUID, IsBoolean, IsOptional, IsString, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAsignacionDto {
  @ApiProperty({ description: 'ID de la Zona Comercial', example: 1 })
  @IsInt()
  zona_id: number;

  @ApiProperty({ description: 'UUID del Vendedor (Servicio Usuarios)', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  vendedor_usuario_id: string;

  @ApiProperty({ description: 'Nombre para caché (opcional)', required: false })
  @IsOptional()
  @IsString()
  nombre_vendedor_cache?: string;

  @ApiProperty({ description: 'Define si es el vendedor principal de la zona', default: true })
  @IsBoolean()
  es_principal: boolean;

  @ApiProperty({ description: 'Fecha inicio asignación', required: false })
  @IsOptional()
  @IsDateString()
  fecha_inicio?: string;
}

export class UpdateAsignacionDto extends CreateAsignacionDto {} 
// (Puedes usar PartialType de @nestjs/swagger si prefieres no repetir)
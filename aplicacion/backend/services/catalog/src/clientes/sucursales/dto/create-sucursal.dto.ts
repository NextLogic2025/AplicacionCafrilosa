import { 
  IsString, IsNotEmpty, IsOptional, IsUUID, IsBoolean, IsInt, 
  ValidateNested, IsNumber 
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

// Clase auxiliar para validar GeoJSON Point
export class GeoPointDto {
  @ApiProperty({ example: 'Point', default: 'Point' })
  @IsString()
  type: string;

  @ApiProperty({ example: [-79.204, -3.993], description: '[Longitud, Latitud]' })
  @IsNumber({}, { each: true })
  coordinates: number[];
}

export class CreateSucursalDto {
  @ApiProperty({ description: 'ID del Cliente dueño de la sucursal' })
  @IsUUID()
  @IsNotEmpty()
  cliente_id: string;

  @ApiProperty({ description: 'Nombre identificador de la sucursal', example: 'Sucursal Centro' })
  @IsString()
  @IsNotEmpty()
  nombre_sucursal: string;

  @ApiProperty({ description: 'Dirección física detallada', required: false })
  @IsOptional()
  @IsString()
  direccion_entrega?: string;

  @ApiProperty({ description: 'Coordenadas GeoJSON', required: false, type: GeoPointDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => GeoPointDto)
  ubicacion_gps?: GeoPointDto;

  @ApiProperty({ description: 'Nombre de la persona de contacto', required: false })
  @IsOptional()
  @IsString()
  contacto_nombre?: string;

  @ApiProperty({ description: 'Teléfono de contacto', required: false })
  @IsOptional()
  @IsString()
  contacto_telefono?: string;

  @ApiProperty({ default: true })
  @IsOptional()
  @IsBoolean()
  activo?: boolean;

  @ApiProperty({ description: 'ID de la Zona Comercial asignada', required: false })
  @IsOptional()
  @IsInt()
  zona_id?: number;
}

export class UpdateSucursalDto extends CreateSucursalDto {}

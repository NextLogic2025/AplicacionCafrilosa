import { IsUUID, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateVehiculoMovimientoDto {
  @ApiProperty({ description: 'ID del despacho (UUID)' })
  @IsUUID()
  despacho_id: string;

  @ApiProperty({ description: 'ID del vehículo (UUID)' })
  @IsUUID()
  vehiculo_id: string;

  @ApiProperty({ description: 'Ubicación (GeoJSON/POINT)' })
  ubicacion: any;

  @ApiProperty({ description: 'Velocidad km/h', required: false })
  @IsOptional()
  @IsNumber()
  velocidad_kmh?: number;

  @ApiProperty({ description: 'Nivel de batería', required: false })
  @IsOptional()
  bateria_nivel?: number;
}

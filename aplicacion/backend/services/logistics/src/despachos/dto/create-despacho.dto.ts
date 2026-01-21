import { IsUUID, IsOptional, IsDateString, IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDespachoDto {
  @ApiProperty({ description: 'Vehículo asignado (UUID)', required: false })
  @IsOptional()
  @IsUUID()
  vehiculo_id?: string;

  @ApiProperty({ description: 'Conductor asignado (UUID)', required: false })
  @IsOptional()
  @IsUUID()
  conductor_id?: string;

  @ApiProperty({ description: 'Fecha programada (YYYY-MM-DD)', required: false })
  @IsOptional()
  @IsDateString()
  fecha_programada?: string;

  @ApiProperty({ description: 'Observaciones', required: false })
  @IsOptional()
  @IsString()
  observaciones_ruta?: string;
}

import { IsUUID, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePruebaEntregaDto {
  @ApiProperty({ description: 'ID de la entrega (UUID)' })
  @IsUUID()
  entrega_id: string;

  @ApiProperty({ description: 'Nombre del receptor', required: false })
  @IsOptional()
  @IsString()
  nombre_receptor?: string;

  @ApiProperty({ description: 'Documento del receptor', required: false })
  @IsOptional()
  @IsString()
  documento_receptor?: string;

  @ApiProperty({ description: 'URL de la firma', required: false })
  @IsOptional()
  @IsString()
  firma_url?: string;

  @ApiProperty({ description: 'URL foto evidencia', required: false })
  @IsOptional()
  @IsString()
  foto_evidencia_url?: string;

  @ApiProperty({ description: 'Ubicación confirmación (GeoJSON/POINT)', required: false })
  @IsOptional()
  ubicacion_confirmacion?: any;
}

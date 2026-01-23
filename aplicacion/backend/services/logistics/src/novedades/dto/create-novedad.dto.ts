import { IsOptional, IsUUID, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateNovedadDto {
  @ApiProperty({ description: 'ID del despacho (UUID)', required: false })
  @IsOptional()
  @IsUUID()
  despacho_id?: string;

  @ApiProperty({ description: 'ID de la entrega (UUID)', required: false })
  @IsOptional()
  @IsUUID()
  entrega_id?: string;

  @ApiProperty({ description: 'Motivo', required: false })
  @IsOptional()
  @IsString()
  motivo?: string;

  @ApiProperty({ description: 'Descripción', required: false })
  @IsOptional()
  @IsString()
  descripcion?: string;

  @ApiProperty({ description: 'URL foto', required: false })
  @IsOptional()
  @IsString()
  foto_url?: string;
}

import { IsUUID, IsInt, IsOptional, IsString, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEntregaDto {
  @ApiProperty({ description: 'ID del despacho (UUID)' })
  @IsUUID()
  despacho_id: string;

  @ApiProperty({ description: 'ID del pedido (UUID)' })
  @IsUUID()
  pedido_id: string;

  @ApiProperty({ description: 'ID del cliente (UUID)', required: false })
  @IsOptional()
  @IsUUID()
  cliente_id?: string;

  @ApiProperty({ description: 'Orden de visita (int)' })
  @IsInt()
  orden_visita: number;

  @ApiProperty({ description: 'Dirección de entrega', required: false })
  @IsOptional()
  @IsString()
  direccion_texto?: string;

  @ApiProperty({ description: 'Coordenadas GeoJSON/POINT', required: false })
  @IsOptional()
  coordenadas_entrega?: any;
}

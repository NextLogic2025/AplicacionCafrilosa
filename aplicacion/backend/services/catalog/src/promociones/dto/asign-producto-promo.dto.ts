import { IsNumber, IsUUID, IsOptional } from 'class-validator';

export class AsignProductoPromoDto {
  @IsUUID()
  producto_id: string;

  @IsOptional()
  @IsNumber()
  precio_oferta_fijo?: number;
}

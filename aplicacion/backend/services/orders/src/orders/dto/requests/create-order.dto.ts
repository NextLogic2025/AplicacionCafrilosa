import { IsUUID, IsArray, ValidateNested, IsOptional, IsNumber, Min, IsString, IsDateString, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class OrderDetailDto {
  @IsUUID()
  producto_id: string;

  @IsNumber()
  @Min(0.01)
  cantidad: number;

  @IsNumber()
  @Min(0)
  precio_unitario: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  precio_original?: number;

  @IsOptional()
  @IsString()
  codigo_sku?: string;

  @IsOptional()
  @IsString()
  nombre_producto?: string;

  @IsOptional()
  @IsString()
  unidad_medida?: string;

  @IsOptional()
  @IsString()
  motivo_descuento?: string;

  @IsOptional()
  @IsInt()
  campania_aplicada_id?: number;
}

export class UbicacionDto {
  @IsNumber()
  lat: number;

  @IsNumber()
  lng: number;
}

export class CreateOrderDto {
  @IsUUID()
  cliente_id: string;

  @IsUUID()
  vendedor_id: string;

  @IsOptional()
  @IsUUID()
  sucursal_id?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderDetailDto)
  items: OrderDetailDto[];

  @IsOptional()
  @IsString()
  observaciones_entrega?: string;

  @IsOptional()
  @IsString()
  condicion_pago?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Fecha de entrega debe ser formato YYYY-MM-DD' })
  fecha_entrega_solicitada?: string;

  @IsOptional()
  @IsString()
  origen_pedido?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => UbicacionDto)
  ubicacion?: UbicacionDto;

  @IsOptional()
  @IsNumber()
  @Min(0)
  descuento_total?: number;
}
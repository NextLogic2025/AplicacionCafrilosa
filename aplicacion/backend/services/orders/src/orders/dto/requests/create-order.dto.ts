import { IsUUID, IsArray, ValidateNested, IsOptional, IsNumber, Min, IsString } from 'class-validator';
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

    @IsString()
    @IsOptional()
    codigo_sku?: string;

    @IsString()
    @IsOptional()
    nombre_producto?: string;

    @IsString()
    @IsOptional()
    unidad_medida?: string;

    @IsString()
    @IsOptional()
    motivo_descuento?: string;
}

export class CreateOrderDto {
    @IsUUID()
    cliente_id: string;

    @IsUUID()
    vendedor_id: string;

    @IsUUID()
    @IsOptional()
    sucursal_id?: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => OrderDetailDto)
    items: OrderDetailDto[];

    @IsOptional()
    observaciones_entrega?: string;
}
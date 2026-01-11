import { IsUUID, IsArray, ValidateNested, IsOptional, IsNumber, Min } from 'class-validator';
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
}

export class CreateOrderDto {
    @IsUUID()
    cliente_id: string;

    @IsUUID()
    @IsOptional()
    sucursal_id?: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => OrderDetailDto)
    items: OrderDetailDto[];

    @IsOptional()
    notas?: string;
}
import { IsUUID, IsNumber, IsPositive, IsOptional, Min } from 'class-validator';

export class UpdateCartItemDto {
    @IsUUID()
    producto_id: string;

    @IsNumber()
    @Min(0.1) // Permite fracciones si se vende por peso
    cantidad: number;

    @IsNumber()
    @IsPositive()
    @IsOptional()
    precio_unitario_ref?: number;
}
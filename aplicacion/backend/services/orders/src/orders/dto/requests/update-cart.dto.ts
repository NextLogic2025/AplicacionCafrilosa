import { IsUUID, IsNumber, IsPositive, IsOptional, Min } from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * DTO para agregar o actualizar items en el carrito
 *
 * Validaciones:
 * - producto_id: UUID válido del producto
 * - cantidad: Mínimo 0.1 (permite fracciones para ventas por peso)
 * - precio_unitario_ref: Opcional, si no se envía se usará 0 por defecto en el servicio
 */
export class UpdateCartItemDto {
    @IsUUID('4', { message: 'El producto_id debe ser un UUID válido' })
    producto_id: string;

    @IsNumber({}, { message: 'La cantidad debe ser un número válido' })
    @Min(0.1, { message: 'La cantidad mínima es 0.1' })
    @Transform(({ value }) => {
        const parsed = parseFloat(value);
        return isNaN(parsed) ? value : parsed;
    })
    cantidad: number;

    @IsOptional()
    @IsNumber({}, { message: 'El precio unitario debe ser un número válido' })
    @IsPositive({ message: 'El precio unitario debe ser positivo' })
    @Transform(({ value }) => {
        if (value === undefined || value === null || value === '') return undefined;
        const parsed = parseFloat(value);
        return isNaN(parsed) ? value : parsed;
    })
    precio_unitario_ref?: number;
}
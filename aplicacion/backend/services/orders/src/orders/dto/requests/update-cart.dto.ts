import { IsUUID, IsNumber, IsOptional, Min } from 'class-validator';
import { Transform } from 'class-transformer';

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
  @IsNumber()
  @Transform(({ value }) => (value === undefined || value === null || value === '') ? undefined : parseFloat(value))
  precio_unitario_ref?: number;
}
import { IsUUID, IsNumber, IsOptional, Min, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

// Nota: Se eliminan los campos de precio que anteriormente permitían que el cliente
// enviara valores que el servidor debe calcular. Ahora el cliente solo puede enviar
// identificadores de campaña y un posible `referido_id`.
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
  @Transform(({ value }) => (value === undefined || value === null || value === '') ? undefined : parseInt(value))
  campania_aplicada_id?: number;

  @IsOptional()
  @IsString()
  motivo_descuento?: string;

  @IsOptional()
  @IsUUID('4')
  referido_id?: string;
}
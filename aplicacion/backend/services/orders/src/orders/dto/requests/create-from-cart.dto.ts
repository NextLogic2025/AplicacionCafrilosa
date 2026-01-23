import { IsOptional, IsUUID, IsNumber } from 'class-validator';

export class CreateFromCartDto {
  @IsOptional()
  forma_pago_solicitada?: string;

  @IsOptional()
  @IsUUID()
  sucursal_id?: string;

  @IsOptional()
  ubicacion?: { lat: number; lng: number };
}

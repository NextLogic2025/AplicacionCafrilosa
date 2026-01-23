import { IsOptional, IsString, IsNumber } from 'class-validator';

export class UbicacionSimpleDto {
  @IsNumber()
  lat: number;

  @IsNumber()
  lng: number;
}

export class CreateFromCartDto {
  @IsOptional()
  @IsString()
  sucursal_id?: string;

  @IsOptional()
  @IsString()
  forma_pago_solicitada?: string;

  @IsOptional()
  ubicacion?: UbicacionSimpleDto;
}

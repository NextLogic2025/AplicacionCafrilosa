import { IsOptional, IsString, IsNumber, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

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
  @ValidateNested()
  @Type(() => UbicacionSimpleDto)
  ubicacion?: UbicacionSimpleDto;
}

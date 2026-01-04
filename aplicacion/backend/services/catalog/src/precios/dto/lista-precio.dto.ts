import { IsString, IsNotEmpty, IsBoolean, IsOptional } from 'class-validator';

export class ListaPrecioDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsBoolean()
  @IsOptional()
  activa?: boolean;

  @IsString()
  @IsOptional()
  moneda?: string;
}

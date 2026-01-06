import { IsString, IsBoolean, IsOptional, IsNotEmpty, Length } from 'class-validator';

export class CreateListaPrecioDto {
  @IsString()
  @IsNotEmpty()
  @Length(3, 50)
  nombre: string;

  @IsString()
  @IsOptional()
  moneda?: string;

  @IsBoolean()
  @IsOptional()
  activa?: boolean;
}
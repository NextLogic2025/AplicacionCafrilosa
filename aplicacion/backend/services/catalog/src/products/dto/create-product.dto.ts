import { IsString, IsNumber, IsBoolean, IsOptional, Min, IsNotEmpty } from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  codigoSku: string;

  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsNumber()
  @IsOptional()
  categoriaId?: number;

  @IsNumber()
  @Min(0)
  pesoUnitarioKg: number;

  @IsNumber()
  @IsOptional()
  volumenM3?: number;

  @IsString()
  @IsOptional()
  unidadMedida?: string;

  @IsBoolean()
  @IsOptional()
  requiereFrio?: boolean;

  @IsString()
  @IsOptional()
  imagenUrl?: string | null;

  // Agrega más validaciones según necesites
}
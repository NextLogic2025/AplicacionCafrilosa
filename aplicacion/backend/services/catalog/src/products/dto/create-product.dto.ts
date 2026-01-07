import { IsString, IsNumber, IsBoolean, IsOptional, Min, IsNotEmpty } from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  codigo_sku: string;

  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsNumber()
  @IsOptional()
  categoria_id?: number;

  @IsNumber()
  @Min(0)
  peso_unitario_kg: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  volumen_m3?: number;

  @IsString()
  @IsOptional()
  unidad_medida?: string;

  @IsString()
  @IsOptional()
  imagen_url?: string;

  @IsBoolean()
  @IsOptional()
  requiere_frio?: boolean;

  @IsBoolean()
  @IsOptional()
  activo?: boolean;
}
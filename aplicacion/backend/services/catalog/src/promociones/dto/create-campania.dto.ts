import { IsString, IsDateString, IsNumber, IsBoolean, IsOptional, IsEnum } from 'class-validator';

export class CreateCampaniaDto {
  @IsString()
  nombre: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsDateString()
  fecha_inicio: string;

  @IsDateString()
  fecha_fin: string;

  @IsEnum(['PORCENTAJE', 'MONTO_FIJO'])
  tipo_descuento: string;

  @IsNumber()
  valor_descuento: number;

  @IsOptional()
  @IsEnum(['GLOBAL', 'POR_LISTA', 'POR_CLIENTE'])
  alcance?: string;

  @IsOptional()
  @IsNumber()
  lista_precios_objetivo_id?: number;

  @IsOptional()
  @IsString()
  imagen_banner_url?: string;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}

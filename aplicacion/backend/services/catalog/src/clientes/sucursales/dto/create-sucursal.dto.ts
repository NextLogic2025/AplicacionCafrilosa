import { IsUUID, IsString, IsOptional, IsBoolean, IsInt } from 'class-validator';

export class CreateSucursalDto {
  @IsUUID()
  cliente_id: string;

  @IsString()
  nombre_sucursal: string;

  @IsOptional()
  @IsString()
  direccion_entrega?: string;

  @IsOptional()
  ubicacion_gps?: any;

  @IsOptional()
  @IsString()
  contacto_nombre?: string;

  @IsOptional()
  @IsString()
  contacto_telefono?: string;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;

  @IsOptional()
  @IsInt()
  zona_id?: number;
}

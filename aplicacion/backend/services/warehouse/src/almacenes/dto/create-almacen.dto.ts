// almacenes/dto/create-almacen.dto.ts
import { IsString, IsBoolean, IsOptional, MaxLength } from 'class-validator';

export class CreateAlmacenDto {
    @IsString()
    @MaxLength(50)
    nombre: string;

    @IsOptional()
    @IsString()
    @MaxLength(10)
    codigoRef?: string;

    @IsOptional()
    @IsBoolean()
    requiereFrio?: boolean;

    @IsOptional()
    @IsString()
    direccionFisica?: string;
}

export class UpdateAlmacenDto {
    @IsOptional()
    @IsString()
    @MaxLength(50)
    nombre?: string;

    @IsOptional()
    @IsString()
    @MaxLength(10)
    codigoRef?: string;

    @IsOptional()
    @IsBoolean()
    requiereFrio?: boolean;

    @IsOptional()
    @IsString()
    direccionFisica?: string;

    @IsOptional()
    @IsBoolean()
    activo?: boolean;
}
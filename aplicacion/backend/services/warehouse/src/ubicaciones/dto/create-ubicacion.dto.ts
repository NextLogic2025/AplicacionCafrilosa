// ubicaciones/dto/create-ubicacion.dto.ts
import { IsString, IsInt, IsNumber, IsBoolean, IsOptional, MaxLength, Min } from 'class-validator';

export class CreateUbicacionDto {
    @IsInt()
    @Min(1)
    almacenId: number;

    @IsString()
    @MaxLength(20)
    codigoVisual: string;

    @IsOptional()
    @IsString()
    @MaxLength(20)
    tipo?: string;

    @IsOptional()
    @IsNumber()
    capacidadMaxKg?: number;

    @IsOptional()
    @IsBoolean()
    esCuarentena?: boolean;
}

export class UpdateUbicacionDto {
    @IsOptional()
    @IsString()
    @MaxLength(20)
    codigoVisual?: string;

    @IsOptional()
    @IsString()
    @MaxLength(20)
    tipo?: string;

    @IsOptional()
    @IsNumber()
    capacidadMaxKg?: number;

    @IsOptional()
    @IsBoolean()
    esCuarentena?: boolean;
}

// lotes/dto/create-lote.dto.ts
import { IsUUID, IsString, IsDateString, IsOptional, MaxLength } from 'class-validator';

export class CreateLoteDto {
    @IsUUID()
    productoId: string;

    @IsString()
    @MaxLength(50)
    numeroLote: string;

    @IsDateString()
    fechaFabricacion: string;

    @IsDateString()
    fechaVencimiento: string;

    @IsOptional()
    @IsString()
    estadoCalidad?: string;
}

export class UpdateLoteDto {
    @IsOptional()
    @IsDateString()
    fechaVencimiento?: string;

    @IsOptional()
    @IsString()
    estadoCalidad?: string;
}
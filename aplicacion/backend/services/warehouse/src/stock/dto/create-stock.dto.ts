// stock/dto/create-stock.dto.ts
import { IsUUID, IsNumber, Min } from 'class-validator';

export class CreateStockDto {
    @IsUUID()
    ubicacionId: string;

    @IsUUID()
    loteId: string;

    @IsNumber()
    @Min(0)
    cantidadFisica: number;
}

export class UpdateStockDto {
    @IsNumber()
    @Min(0)
    cantidadFisica: number;
}

export class AjusteStockDto {
    @IsUUID()
    ubicacionId: string;

    @IsUUID()
    loteId: string;

    @IsNumber()
    cantidad: number;

    @IsUUID()
    usuarioResponsableId: string;
}
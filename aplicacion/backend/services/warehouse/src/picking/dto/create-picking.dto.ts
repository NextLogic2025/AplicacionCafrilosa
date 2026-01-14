// picking/dto/create-picking.dto.ts
import { IsUUID, IsNumber, IsString, IsOptional, IsArray, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class PickingItemDto {
    @IsUUID()
    productoId: string;

    @IsNumber()
    @Min(0.01)
    cantidadSolicitada: number;
}

export class CreatePickingDto {
    @IsUUID()
    pedidoId: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => PickingItemDto)
    items: PickingItemDto[];
}

export class AceptarPickingDto {
    @IsUUID()
    bodegueroId: string;
}

export class CompletarPickingItemDto {
    @IsUUID()
    loteConfirmado: string;

    @IsNumber()
    @Min(0)
    cantidadPickeada: number;
}
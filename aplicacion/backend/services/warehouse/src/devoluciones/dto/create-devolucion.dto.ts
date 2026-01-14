// devoluciones/dto/create-devolucion.dto.ts
import { IsUUID, IsNumber, IsString, IsOptional, Min } from 'class-validator';

export class CreateDevolucionDto {
    @IsOptional()
    @IsUUID()
    notaCreditoId?: string;

    @IsOptional()
    @IsUUID()
    pedidoOrigenId?: string;

    @IsOptional()
    @IsUUID()
    pickingId?: string;

    @IsOptional()
    @IsUUID()
    loteId?: string;

    @IsNumber()
    @Min(0.01)
    cantidadRecibida: number;

    @IsOptional()
    @IsString()
    estadoProducto?: string;

    @IsOptional()
    @IsString()
    decisionInventario?: string;

    @IsOptional()
    @IsString()
    observaciones?: string;
}

export class ProcesarDevolucionDto {
    @IsString()
    decisionInventario: string;

    @IsOptional()
    @IsUUID()
    ubicacionDestino?: string;

    @IsOptional()
    @IsString()
    observaciones?: string;
}

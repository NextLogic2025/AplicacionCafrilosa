import { 
    IsString, IsNotEmpty, IsOptional, IsEmail, IsUUID, IsInt, 
    IsBoolean, Min, MaxLength, Matches, IsNumber 
} from 'class-validator';
import { ApiProperty, PartialType } from '@nestjs/swagger';

export class CreateClienteDto {
    @ApiProperty({ description: 'Identificación (RUC o Cédula)', example: '1104567890001' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(13)
    @Matches(/^[0-9]+$/, { message: 'La identificación solo debe contener números' })
    identificacion: string;

    @ApiProperty({ description: 'Tipo de documento', example: 'RUC', default: 'RUC' })
    @IsOptional()
    @IsString()
    tipo_identificacion?: string;

    @ApiProperty({ description: 'Razón Social (Nombre legal)', example: 'Distribuidora El Sol S.A.' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(200)
    razon_social: string;

    @ApiProperty({ description: 'Nombre Comercial (Marca)', required: false })
    @IsOptional()
    @IsString()
    @MaxLength(200)
    nombre_comercial?: string;

    @ApiProperty({ description: 'ID del Usuario del sistema asociado (UUID)', required: false })
    @IsOptional()
    @IsUUID()
    usuario_principal_id?: string;

    @ApiProperty({ description: 'ID de la Zona Comercial', required: false })
    @IsOptional()
    @IsInt()
    zona_comercial_id?: number;

    @ApiProperty({ description: 'Dirección física completa', required: false })
    @IsOptional()
    @IsString()
    direccion_texto?: string;

    // Campos financieros (Opcionales al crear, por defecto 0/false)
    
    @ApiProperty({ description: 'Tiene crédito habilitado', default: false })
    @IsOptional()
    @IsBoolean()
    tiene_credito?: boolean;

    @ApiProperty({ description: 'Límite de crédito aprobado', example: 1000.00 })
    @IsOptional()
    // TypeORM decimal viene como string para precisión, pero el DTO puede recibir number o string numérico
    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(0)
    limite_credito?: number;

    @ApiProperty({ description: 'Días de plazo para pago', example: 30 })
    @IsOptional()
    @IsInt()
    @Min(0)
    dias_plazo?: number;
}

export class UpdateClienteDto extends PartialType(CreateClienteDto) {}

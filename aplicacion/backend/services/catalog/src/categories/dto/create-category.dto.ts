import { IsString, IsNotEmpty, IsOptional, IsUrl, IsBoolean, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({ description: 'Nombre de la categoría', example: 'Lácteos' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  nombre: string;

  @ApiProperty({ description: 'Descripción detallada', required: false, example: 'Productos derivados de la leche' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  descripcion?: string;

  @ApiProperty({ description: 'URL de la imagen representativa', required: false })
  @IsOptional()
  @IsUrl({}, { message: 'La imagen debe ser una URL válida' })
  imagen_url?: string;

  @ApiProperty({ description: 'Estado inicial', default: true })
  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}

// Para update usamos PartialType de Swagger para heredar las reglas pero opcionales
import { PartialType } from '@nestjs/swagger';
export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}
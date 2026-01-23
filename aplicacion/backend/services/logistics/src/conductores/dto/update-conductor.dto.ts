import { IsOptional, IsString, IsUUID, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateConductorDto {
  @ApiPropertyOptional({ description: 'Usuario (UUID) vinculado al conductor' })
  @IsOptional()
  @IsUUID()
  usuario_id?: string;

  @ApiPropertyOptional({ description: 'Nombre completo del conductor' })
  @IsOptional()
  @IsString()
  nombre_completo?: string;

  @ApiPropertyOptional({ description: 'Número/licencia' })
  @IsOptional()
  @IsString()
  licencia?: string;

  @ApiPropertyOptional({ description: 'Activo' })
  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}

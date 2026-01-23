import { IsOptional, IsString, IsUUID, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateConductorDto {
  @ApiProperty({ description: 'Usuario (UUID) vinculado al conductor', required: false })
  @IsOptional()
  @IsUUID()
  usuario_id?: string;

  @ApiProperty({ description: 'Nombre completo del conductor' })
  @IsString()
  nombre_completo: string;

  @ApiProperty({ description: 'Número/licencia', required: false })
  @IsOptional()
  @IsString()
  licencia?: string;

  @ApiProperty({ description: 'Activo', required: false })
  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}

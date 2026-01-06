import { IsUUID, IsNumber, IsInt, Min } from 'class-validator';

export class CreatePrecioDto {
  @IsUUID()
  productoId: string;

  @IsInt()
  @Min(1)
  listaId: number;

  @IsNumber()
  @Min(0.01, { message: 'El precio debe ser mayor a 0' })
  precio: number;
}
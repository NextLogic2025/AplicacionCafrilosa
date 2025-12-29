import { IsUUID, IsNumber, IsInt, Min } from 'class-validator';

export class AsignarPrecioDto {
  @IsUUID()
  productoId: string;

  @IsInt()
  listaId: number; // 1, 2, o 3

  @IsNumber()
  @Min(0)
  precio: number;
}

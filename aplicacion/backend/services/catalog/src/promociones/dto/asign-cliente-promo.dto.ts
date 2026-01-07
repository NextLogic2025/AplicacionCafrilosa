import { IsUUID } from 'class-validator';

export class AsignClientePromoDto {
  @IsUUID()
  cliente_id: string;
}

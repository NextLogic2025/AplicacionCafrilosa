import { IsString, IsIn, IsOptional, IsUUID } from 'class-validator';

export class CreateFromCartDto {
  @IsString({ message: 'condicion_pago es requerido y debe ser string' })
  @IsIn(['CONTADO', 'CREDITO', 'TRANSFERENCIA', 'CHEQUE'], {
    message: 'condicion_pago debe ser uno de: CONTADO, CREDITO, TRANSFERENCIA, CHEQUE',
  })
  condicion_pago: string;

  @IsOptional()
  @IsUUID()
  sucursal_id?: string;
}

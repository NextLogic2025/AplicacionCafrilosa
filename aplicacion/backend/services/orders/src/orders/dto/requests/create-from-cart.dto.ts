import { IsString, IsIn, IsOptional, IsUUID } from 'class-validator';

export class CreateFromCartDto {
  @IsString({ message: 'forma_pago_solicitada es requerido y debe ser string' })
  @IsIn(['CONTADO', 'CREDITO', 'TRANSFERENCIA', 'CHEQUE'], {
    message: 'forma_pago_solicitada debe ser uno de: CONTADO, CREDITO, TRANSFERENCIA, CHEQUE',
  })
  forma_pago_solicitada: string;

  @IsOptional()
  @IsUUID()
  sucursal_id?: string;
}

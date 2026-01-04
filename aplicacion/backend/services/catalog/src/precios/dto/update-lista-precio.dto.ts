import { PartialType } from '@nestjs/mapped-types';

import { ListaPrecioDto } from './lista-precio.dto';

export class UpdateListaPrecioDto extends PartialType(ListaPrecioDto) {}

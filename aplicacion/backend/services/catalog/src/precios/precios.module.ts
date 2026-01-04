import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PreciosService } from './precios.service';
import { PreciosController } from './precios.controller';
import { PrecioItem } from './entities/precio.entity';
import { ListaPrecio } from './entities/lista-precio.entity';
import { Product } from '../products/entities/product.entity';
import { ClientesModule } from '../clientes/clientes.module';

@Module({
  imports: [TypeOrmModule.forFeature([PrecioItem, ListaPrecio, Product]), ClientesModule],
  providers: [PreciosService],
  controllers: [PreciosController],
})
export class PreciosModule {}

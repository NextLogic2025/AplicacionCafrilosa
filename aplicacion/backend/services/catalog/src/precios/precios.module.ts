import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Product } from '../products/entities/product.entity';
import { Category } from '../categories/entities/category.entity';
import { ProductoPromocion } from '../promociones/entities/producto-promocion.entity';
import { ClientesModule } from '../clientes/clientes.module';

import { PreciosService } from './precios.service';
import { PreciosController } from './precios.controller';
import { PrecioItem } from './entities/precio.entity';
import { ListaPrecio } from './entities/lista-precio.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PrecioItem, ListaPrecio, Product, Category, ProductoPromocion]), ClientesModule],
  providers: [PreciosService],
  controllers: [PreciosController],
  exports: [PreciosService],
})
export class PreciosModule {}
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Category } from '../categories/entities/category.entity';
import { PrecioItem } from '../precios/entities/precio.entity';
import { ProductoPromocion } from '../promociones/entities/producto-promocion.entity';
import { CampaniaPromocional } from '../promociones/entities/campania.entity';
import { ClientesModule } from '../clientes/clientes.module';
import { PreciosModule } from '../precios/precios.module';
import { PromocionesModule } from '../promociones/promociones.module';

import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { ProductsInternalController } from './products.internal.controller';
import { Product } from './entities/product.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, Category, PrecioItem, ProductoPromocion, CampaniaPromocional]),
    ClientesModule,
    PreciosModule,
    PromocionesModule,
  ],
  controllers: [ProductsController, ProductsInternalController],
  providers: [ProductsService]
})
export class ProductsModule {}

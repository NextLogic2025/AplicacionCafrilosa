import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PromocionesService } from './promociones.service';
import { PromocionesController } from './promociones.controller';
import { CampaniaPromocional } from './entities/campania.entity';
import { ProductoPromocion } from './entities/producto-promocion.entity';


@Module({
  imports: [TypeOrmModule.forFeature([CampaniaPromocional, ProductoPromocion])],
  providers: [PromocionesService],
  controllers: [PromocionesController],
  exports: [PromocionesService],
})
export class PromocionesModule {}

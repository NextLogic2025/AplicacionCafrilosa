import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PreciosModule } from '../precios/precios.module';
import { ClientesModule } from '../clientes/clientes.module';

import { PromocionesService } from './promociones.service';
import { PromocionesController } from './promociones.controller';
import { CampaniaPromocional } from './entities/campania.entity';
import { ProductoPromocion } from './entities/producto-promocion.entity';
import { PromocionClientePermitido } from './entities/promocion-cliente-permitido.entity';



@Module({
  imports: [TypeOrmModule.forFeature([CampaniaPromocional, ProductoPromocion, PromocionClientePermitido]), PreciosModule, ClientesModule],
  providers: [PromocionesService],
  controllers: [PromocionesController],
  exports: [PromocionesService],
})
export class PromocionesModule {}

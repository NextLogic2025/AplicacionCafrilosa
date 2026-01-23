import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DespachosService } from './despachos.service';
import { DespachosController } from './despachos.controller';
import { Despacho } from './entities/despacho.entity';
import { EntregaDespacho } from './entities/entrega-despacho.entity';
import { PruebaEntrega } from './entities/prueba-entrega.entity';
import { NovedadRuta } from '../novedades/entities/novedad-ruta.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Despacho, EntregaDespacho, PruebaEntrega, NovedadRuta])],
  providers: [DespachosService],
  controllers: [DespachosController],
  exports: [DespachosService],
})
export class DespachosModule {}

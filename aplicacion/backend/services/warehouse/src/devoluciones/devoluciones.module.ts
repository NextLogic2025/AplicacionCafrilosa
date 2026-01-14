// devoluciones/devoluciones.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DevolucionRecibida } from './entities/devolucion-recibida.entity';
import { StockUbicacion } from '../stock/entities/stock-ubicacion.entity';
import { Lote } from '../lotes/entities/lote.entity';
import { KardexMovimiento } from '../kardex/entities/kardex-movimiento.entity';
import { DevolucionesService } from './devoluciones.service';
import { DevolucionesController } from './devoluciones.controller';

@Module({
    imports: [TypeOrmModule.forFeature([DevolucionRecibida, StockUbicacion, Lote, KardexMovimiento])],
    providers: [DevolucionesService],
    controllers: [DevolucionesController],
    exports: [DevolucionesService],
})
export class DevolucionesModule { }
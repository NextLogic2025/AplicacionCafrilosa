// picking/picking.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';

import { PickingOrden } from './entities/picking-orden.entity';
import { PickingItem } from './entities/picking-item.entity';
import { StockUbicacion } from '../stock/entities/stock-ubicacion.entity';
import { Lote } from '../lotes/entities/lote.entity';
import { KardexMovimiento } from '../kardex/entities/kardex-movimiento.entity';
import { PickingService } from './picking.service';
import { PickingController } from './picking.controller';

@Module({
    imports: [TypeOrmModule.forFeature([PickingOrden, PickingItem, StockUbicacion, Lote, KardexMovimiento])],
    providers: [PickingService],
    controllers: [PickingController],
    exports: [PickingService],
})
export class PickingModule { }
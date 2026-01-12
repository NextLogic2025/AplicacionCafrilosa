// stock/stock.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { StockUbicacion } from './entities/stock-ubicacion.entity';
import { Ubicacion } from '../ubicaciones/entities/ubicacion.entity';
import { Lote } from '../lotes/entities/lote.entity';
import { KardexMovimiento } from '../kardex/entities/kardex-movimiento.entity';
import { StockService } from './stock.service';
import { StockController } from './stock.controller';

@Module({
    imports: [TypeOrmModule.forFeature([StockUbicacion, Ubicacion, Lote, KardexMovimiento])],
    providers: [StockService],
    controllers: [StockController],
    exports: [StockService],
})
export class StockModule { }
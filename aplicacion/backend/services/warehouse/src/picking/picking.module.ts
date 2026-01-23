// picking/picking.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';

import { PickingOrden } from './entities/picking-orden.entity';
import { PickingItem } from './entities/picking-item.entity';
import { StockUbicacion } from '../stock/entities/stock-ubicacion.entity';
import { Lote } from '../lotes/entities/lote.entity';
import { KardexMovimiento } from '../kardex/entities/kardex-movimiento.entity';
// reservations removed: Reservation entities deprecated
import { PickingService } from './picking.service';
import { CatalogExternalService } from '../common/external/catalog.external.service';
import { OrdersExternalService } from '../common/external/orders.external.service';
import { UsuariosExternalService } from '../common/external/usuarios.external.service';
import { PickingController } from './picking.controller';
import { PickingInternalController } from './picking.internal.controller';

@Module({
    imports: [TypeOrmModule.forFeature([PickingOrden, PickingItem, StockUbicacion, Lote, KardexMovimiento])],
    providers: [PickingService, CatalogExternalService, OrdersExternalService, UsuariosExternalService],
    controllers: [PickingController, PickingInternalController],
    exports: [PickingService],
})
export class PickingModule { }
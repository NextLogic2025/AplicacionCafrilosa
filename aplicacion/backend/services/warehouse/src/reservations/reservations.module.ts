import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReservationsService } from './reservations.service';
import { CatalogExternalService } from '../common/external/catalog.external.service';
import { OrdersExternalService } from '../common/external/orders.external.service';
import { ReservationsController } from './reservations.controller';
import { ReservationsInternalController } from './reservations.internal.controller';
import { Reservation } from './entities/reservation.entity';
import { ReservationItem } from './entities/reservation-item.entity';
import { StockUbicacion } from '../stock/entities/stock-ubicacion.entity';
import { PickingModule } from '../picking/picking.module';

@Module({
  imports: [TypeOrmModule.forFeature([Reservation, ReservationItem, StockUbicacion]), PickingModule],
  controllers: [ReservationsController, ReservationsInternalController],
  providers: [ReservationsService, CatalogExternalService, OrdersExternalService],
  exports: [ReservationsService],
})
export class ReservationsModule {}

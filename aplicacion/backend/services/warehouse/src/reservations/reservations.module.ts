import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReservationsService } from './reservations.service';
import { ReservationsController } from './reservations.controller';
import { Reservation } from './entities/reservation.entity';
import { ReservationItem } from './entities/reservation-item.entity';
import { StockUbicacion } from '../stock/entities/stock-ubicacion.entity';
import { PickingModule } from '../picking/picking.module';

@Module({
  imports: [TypeOrmModule.forFeature([Reservation, ReservationItem, StockUbicacion]), PickingModule],
  controllers: [ReservationsController],
  providers: [ReservationsService],
  exports: [ReservationsService],
})
export class ReservationsModule {}

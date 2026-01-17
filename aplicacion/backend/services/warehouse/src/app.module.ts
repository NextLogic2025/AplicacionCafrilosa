import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { HttpModule } from '@nestjs/axios';

import { ConfigModule } from './config/config.module';
import { HealthModule } from './health/health.module';
import { AlmacenesModule } from './almacenes/almacenes.module';
import { UbicacionesModule } from './ubicaciones/ubicaciones.module';
import { LotesModule } from './lotes/lotes.module';
import { StockModule } from './stock/stock.module';
import { PickingModule } from './picking/picking.module';
import { ReservationsModule } from './reservations/reservations.module';
import { KardexModule } from './kardex/kardex.module';
import { DevolucionesModule } from './devoluciones/devoluciones.module';
import { JwtStrategy } from './auth/strategies/jwt.strategy';

import { Almacen } from './almacenes/entities/almacen.entity';
import { Ubicacion } from './ubicaciones/entities/ubicacion.entity';
import { Lote } from './lotes/entities/lote.entity';
import { StockUbicacion } from './stock/entities/stock-ubicacion.entity';
import { Reservation } from './reservations/entities/reservation.entity';
import { ReservationItem } from './reservations/entities/reservation-item.entity';
import { PickingOrden } from './picking/entities/picking-orden.entity';
import { PickingItem } from './picking/entities/picking-item.entity';
import { KardexMovimiento } from './kardex/entities/kardex-movimiento.entity';
import { DevolucionRecibida } from './devoluciones/entities/devolucion-recibida.entity';

@Module({
    imports: [
        ConfigModule,
        HttpModule,
        TypeOrmModule.forRoot({
            type: 'postgres',
            url: process.env.DATABASE_URL,
            entities: [
                Almacen,
                Ubicacion,
                Lote,
                StockUbicacion,
                PickingOrden,
                PickingItem,
                KardexMovimiento,
                DevolucionRecibida,
                Reservation,
                ReservationItem,
            ],
            autoLoadEntities: true,
            synchronize: false,
            logging: false,
        }),
        PassportModule.register({ defaultStrategy: 'jwt' }),
        HealthModule,
        AlmacenesModule,
        UbicacionesModule,
        LotesModule,
        StockModule,
        PickingModule,
        ReservationsModule,
        KardexModule,
        DevolucionesModule,
    ],
    providers: [JwtStrategy],
})
export class AppModule { }
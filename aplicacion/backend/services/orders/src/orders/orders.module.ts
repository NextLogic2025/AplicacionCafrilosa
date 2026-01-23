import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

import { Pedido } from './entities/pedido.entity';
import { DetallePedido } from './entities/detalle-pedido.entity';
import { CarritoCabecera } from './entities/carrito-cabecera.entity';
import { CarritoItem } from './entities/carrito-item.entity';
import { EstadoPedido } from './entities/estado-pedido.entity';
import { HistorialEstado } from './entities/historial-estado.entity';
import { PromocionAplicada } from './entities/promocion-aplicada.entity';

import { OrdersController } from './controllers/orders.controller';
import { CartController } from './controllers/cart.controller';
import { EstadosController } from './controllers/estados.controller';
import { InternalAdminController } from './controllers/internal-admin.controller';
import { InternalController } from './controllers/internal.controller';
import { OrdersService } from './services/orders.service';
import { CartService } from './services/cart.service';
import { OrderListenerService } from './services/order-listener.service';
import { CatalogExternalService } from '../common/external/catalog.external.service';
import { WarehouseExternalService } from '../common/external/warehouse.external.service';
import { FinanceExternalService } from '../common/external/finance.external.service';
import { OrderOwnershipGuard } from './guards/order-ownership.guard';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([
      Pedido,
      DetallePedido,
      CarritoCabecera,
      CarritoItem,
      EstadoPedido,
      HistorialEstado,
      PromocionAplicada,
    ]),
  ],
  controllers: [OrdersController, CartController, EstadosController, InternalAdminController, InternalController],
  providers: [OrdersService, CartService, OrderListenerService, OrderOwnershipGuard, CatalogExternalService, WarehouseExternalService, FinanceExternalService],
  exports: [OrdersService, CartService],
})
export class OrdersModule {}

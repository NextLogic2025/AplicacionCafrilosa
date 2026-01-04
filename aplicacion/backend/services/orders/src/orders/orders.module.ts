import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { Pedido } from './entities/pedido.entity';
import { DetallePedido } from './entities/detalle-pedido.entity';
import { CarritoCabecera } from './entities/carrito-cabecera.entity';
import { CarritoItem } from './entities/carrito-item.entity';
import { EstadoPedido } from './entities/estado-pedido.entity';
import { HistorialEstado } from './entities/historial-estado.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Pedido, DetallePedido, CarritoCabecera, CarritoItem, EstadoPedido, HistorialEstado])],
  providers: [OrdersService],
  controllers: [OrdersController],
})
export class OrdersModule {}

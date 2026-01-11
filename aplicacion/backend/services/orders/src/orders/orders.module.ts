import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

// Entidades
import { Pedido } from './entities/pedido.entity';
import { DetallePedido } from './entities/detalle-pedido.entity';
import { CarritoCabecera } from './entities/carrito-cabecera.entity';
import { CarritoItem } from './entities/carrito-item.entity';
import { EstadoPedido } from './entities/estado-pedido.entity';
import { HistorialEstado } from './entities/historial-estado.entity';

// Controladores y Servicios
import { OrdersController } from './controllers/orders.controller';
import { OrdersService } from './services/orders.service';
import { CartService } from './services/cart.service';
import { OrderListenerService } from './services/order-listener.service';

@Module({
    imports: [
        ConfigModule, // Para DATABASE_URL
        TypeOrmModule.forFeature([
            Pedido,
            DetallePedido,
            CarritoCabecera,
            CarritoItem,
            EstadoPedido,
            HistorialEstado,
        ]),
    ],
    controllers: [OrdersController],
    providers: [
        OrdersService,
        CartService,
        OrderListenerService, // Se inicia automáticamente con el módulo
    ],
    exports: [OrdersService, CartService], // Permitir uso en otros módulos si es necesario
})
export class OrdersModule { }
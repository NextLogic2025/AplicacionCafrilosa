import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { OrdersModule } from './orders/orders.module';
import { AuthModule } from './auth/auth.module';
import { Pedido } from './orders/entities/pedido.entity';
import { DetallePedido } from './orders/entities/detalle-pedido.entity';
import { CarritoCabecera } from './orders/entities/carrito-cabecera.entity';
import { CarritoItem } from './orders/entities/carrito-item.entity';
import { EstadoPedido } from './orders/entities/estado-pedido.entity';
import { HistorialEstado } from './orders/entities/historial-estado.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USER || 'admin',
      password: process.env.DB_PASSWORD || 'root',
      database: process.env.DB_NAME || 'orders_db',
      entities: [Pedido, DetallePedido, CarritoCabecera, CarritoItem, EstadoPedido, HistorialEstado],
      synchronize: false,
      retryAttempts: 5,
      retryDelay: 3000,
      logging: true,
    }),
    AuthModule,
    OrdersModule,
  ],
})
export class AppModule {}

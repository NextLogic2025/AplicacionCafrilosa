import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule } from './config/config.module';
import { OrdersModule } from './orders/orders.module';
import { JwtStrategy } from './auth/strategies/jwt.strategy';
import { ServiceHttpModule } from './common/http/service-http.module';

@Module({
  imports: [
    ConfigModule,
    ServiceHttpModule,
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      autoLoadEntities: true,
      synchronize: false, // ¡Falso en producción! Usa migraciones.
    }),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    OrdersModule,
  ],
  providers: [JwtStrategy],
})
export class AppModule {}

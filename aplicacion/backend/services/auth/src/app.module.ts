import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

import { AuthModule } from './auth/auth.module';
import { ConfigModule } from './config/config.module';
import { HealthModule } from './health/health.module';
import { ServiceHttpModule } from './common/http/service-http.module';
import { ThrottlerExceptionFilter } from './common/filters/throttle-exception.filter';

@Module({
  imports: [
    ConfigModule,
    ServiceHttpModule,
    // Rate Limiting Global: 10 requests por minuto por IP
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000, // 60 segundos
        limit: 10,  // 10 requests por minuto
      },
    ]),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      synchronize: false,
      autoLoadEntities: true,
    }),
    AuthModule,
    HealthModule,
  ],
  providers: [
    // Registrar ThrottlerGuard como guard global
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // Filtro de excepciones personalizado para rate limiting
    {
      provide: APP_FILTER,
      useClass: ThrottlerExceptionFilter,
    },
  ],
})
export class AppModule {}

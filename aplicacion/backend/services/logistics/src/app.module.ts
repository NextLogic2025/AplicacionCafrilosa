import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';

import { DespachosModule } from './despachos/despachos.module';
import { VehiculosModule } from './vehiculos/vehiculos.module';
import { ConductoresModule } from './conductores/conductores.module';
import { ServiceHttpModule } from './common/http/service-http.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt.guard';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      autoLoadEntities: true,
      synchronize: false,
      logging: false,
    }),
    ServiceHttpModule,
    AuthModule,
    DespachosModule,
    VehiculosModule,
    ConductoresModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}

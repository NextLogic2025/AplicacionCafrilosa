import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DespachosModule } from './despachos/despachos.module';
import { VehiculosModule } from './vehiculos/vehiculos.module';
import { ConductoresModule } from './conductores/conductores.module';
import { ServiceHttpModule } from './common/http/service-http.module';

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
    DespachosModule,
    VehiculosModule,
    ConductoresModule,
  ],
})
export class AppModule {}

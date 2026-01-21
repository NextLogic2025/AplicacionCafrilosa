import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VehiculosService } from './vehiculos.service';
import { VehiculosController } from './vehiculos.controller';
import { Vehiculo } from './entities/vehiculo.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Vehiculo])],
  providers: [VehiculosService],
  controllers: [VehiculosController],
  exports: [VehiculosService],
})
export class VehiculosModule {}

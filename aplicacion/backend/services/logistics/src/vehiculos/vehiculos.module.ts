import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VehiculosService } from './vehiculos.service';
import { VehiculosController } from './vehiculos.controller';
import { Vehiculo } from './entities/vehiculo.entity';
import { VehiculoMovimiento } from '../movimientos/entities/vehiculo-movimiento.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Vehiculo, VehiculoMovimiento])],
  providers: [VehiculosService],
  controllers: [VehiculosController],
  exports: [VehiculosService],
})
export class VehiculosModule {}

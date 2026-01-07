import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SucursalesService } from './sucursales.service';
import { SucursalesController } from './sucursales.controller';
import { SucursalCliente } from './entities/sucursal.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SucursalCliente])],
  providers: [SucursalesService],
  controllers: [SucursalesController],
  exports: [SucursalesService],
})
export class SucursalesModule {}
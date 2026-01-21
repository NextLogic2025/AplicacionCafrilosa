import { Module, forwardRef } from '@nestjs/common';
import { ClientesModule } from '../clientes.module';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SucursalesService } from './sucursales.service';
import { SucursalesController } from './sucursales.controller';
import { SucursalesInternalController } from './sucursales-internal.controller';
import { SucursalCliente } from './entities/sucursal.entity';
import { ZonaComercial } from '../../zonas/entities/zona.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SucursalCliente, ZonaComercial]), forwardRef(() => ClientesModule)],
  providers: [SucursalesService],
  controllers: [SucursalesController, SucursalesInternalController],
  exports: [SucursalesService],
})
export class SucursalesModule {}
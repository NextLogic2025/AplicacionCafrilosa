import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';

import { ClientesService } from './clientes.service';
import { ClientesController } from './clientes.controller';
import { Cliente } from './entities/cliente.entity';
import { ClientsInternalController } from './clients-internal.controller';
import { SucursalesModule } from './sucursales/sucursales.module';
import { ZonaComercial } from '../zonas/entities/zona.entity';
import { AsignacionVendedores } from '../asignacion/entities/asignacion-vendedores.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Cliente, ZonaComercial, AsignacionVendedores]), SucursalesModule, HttpModule],
  providers: [ClientesService],
  controllers: [ClientesController, ClientsInternalController],
  exports: [ClientesService],
})
export class ClientesModule {}

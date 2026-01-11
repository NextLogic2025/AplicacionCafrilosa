import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';

import { ClientesService } from './clientes.service';
import { ClientesController } from './clientes.controller';
import { Cliente } from './entities/cliente.entity';
import { SucursalesModule } from './sucursales/sucursales.module';
import { ZonaComercial } from '../zonas/entities/zona.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Cliente, ZonaComercial]), SucursalesModule, HttpModule],
  providers: [ClientesService],
  controllers: [ClientesController],
  exports: [ClientesService],
})
export class ClientesModule {}

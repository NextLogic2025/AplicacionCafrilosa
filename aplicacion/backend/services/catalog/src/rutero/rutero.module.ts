import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Cliente } from '../clientes/entities/cliente.entity';
import { SucursalCliente } from '../clientes/sucursales/entities/sucursal.entity';
import { ZonaComercial } from '../zonas/entities/zona.entity';
import { AsignacionVendedores } from '../asignacion/entities/asignacion-vendedores.entity';

import { RuteroController } from './rutero.controller';
import { RuteroPlanificado } from './entities/rutero-planificado.entity';
import { RuteroService } from './rutero.service';
import { UsuariosExternalService } from '../common/external/usuarios.external.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RuteroPlanificado,
      Cliente,
      SucursalCliente,
      ZonaComercial,
      AsignacionVendedores,
    ]),
  ],
  providers: [RuteroService, UsuariosExternalService],
  controllers: [RuteroController],
  exports: [RuteroService],
})
export class RuteroModule {}

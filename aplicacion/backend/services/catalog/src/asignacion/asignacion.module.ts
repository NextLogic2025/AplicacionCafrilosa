import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AsignacionService } from './asignacion.service';
import { AsignacionController } from './asignacion.controller';
import { AsignacionVendedores } from './entities/asignacion-vendedores.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AsignacionVendedores])],
  providers: [AsignacionService],
  controllers: [AsignacionController],
  exports: [AsignacionService],
})
export class AsignacionModule {}

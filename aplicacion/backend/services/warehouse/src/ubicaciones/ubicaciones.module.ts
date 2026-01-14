// ubicaciones/ubicaciones.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Ubicacion } from './entities/ubicacion.entity';
import { Almacen } from '../almacenes/entities/almacen.entity';
import { UbicacionesService } from './ubicaciones.service';
import { UbicacionesController } from './ubicaciones.controller';

@Module({
    imports: [TypeOrmModule.forFeature([Ubicacion, Almacen])],
    providers: [UbicacionesService],
    controllers: [UbicacionesController],
    exports: [UbicacionesService],
})
export class UbicacionesModule { }
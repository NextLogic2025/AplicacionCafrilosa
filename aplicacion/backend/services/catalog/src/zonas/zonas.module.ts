import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ZonasService } from './zonas.service';
import { ZonasController } from './zonas.controller';
import { ZonaComercial } from './entities/zona.entity';


@Module({
  imports: [TypeOrmModule.forFeature([ZonaComercial])],
  providers: [ZonasService],
  controllers: [ZonasController],
  exports: [ZonasService],
})
export class ZonasModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PreciosService } from './precios.service';
import { PreciosController } from './precios.controller';
import { PrecioItem } from './entities/precio.entity';
import { ListaPrecio } from './entities/lista-precio.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PrecioItem, ListaPrecio])],
  providers: [PreciosService],
  controllers: [PreciosController],
})
export class PreciosModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RuteroService } from './rutero.service';
import { RuteroController } from './rutero.controller';
import { RuteroPlanificado } from './entities/rutero-planificado.entity';

@Module({
  imports: [TypeOrmModule.forFeature([RuteroPlanificado])],
  providers: [RuteroService],
  controllers: [RuteroController],
  exports: [RuteroService],
})
export class RuteroModule {}

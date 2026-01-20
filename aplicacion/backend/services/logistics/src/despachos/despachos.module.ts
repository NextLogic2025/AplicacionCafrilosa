import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DespachosService } from './despachos.service';
import { DespachosController } from './despachos.controller';
import { Despacho } from './entities/despacho.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Despacho])],
  providers: [DespachosService],
  controllers: [DespachosController],
  exports: [DespachosService],
})
export class DespachosModule {}

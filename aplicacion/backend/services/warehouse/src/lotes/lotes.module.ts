// lotes/lotes.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Lote } from './entities/lote.entity';
import { LotesService } from './lotes.service';
import { LotesController } from './lotes.controller';

@Module({
    imports: [TypeOrmModule.forFeature([Lote])],
    providers: [LotesService],
    controllers: [LotesController],
    exports: [LotesService],
})
export class LotesModule { }
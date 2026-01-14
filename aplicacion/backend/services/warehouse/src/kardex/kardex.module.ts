// kardex/kardex.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { KardexMovimiento } from './entities/kardex-movimiento.entity';
import { KardexService } from './kardex.service';
import { KardexController } from './kardex.controller';

@Module({
    imports: [TypeOrmModule.forFeature([KardexMovimiento])],
    providers: [KardexService],
    controllers: [KardexController],
    exports: [KardexService],
})
export class KardexModule { }
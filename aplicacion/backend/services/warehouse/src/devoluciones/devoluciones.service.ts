// devoluciones/devoluciones.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, DeepPartial } from 'typeorm';

import { DevolucionRecibida } from './entities/devolucion-recibida.entity';
import { StockUbicacion } from '../stock/entities/stock-ubicacion.entity';
import { KardexMovimiento } from '../kardex/entities/kardex-movimiento.entity';
import { Lote } from '../lotes/entities/lote.entity';
import { CreateDevolucionDto, ProcesarDevolucionDto } from './dto/create-devolucion.dto';

@Injectable()
export class DevolucionesService {
    constructor(
        @InjectRepository(DevolucionRecibida)
        private readonly repo: Repository<DevolucionRecibida>,
        @InjectRepository(StockUbicacion)
        private readonly stockRepo: Repository<StockUbicacion>,
        @InjectRepository(Lote)
        private readonly loteRepo: Repository<Lote>,
        @InjectRepository(KardexMovimiento)
        private readonly kardexRepo: Repository<KardexMovimiento>,
    ) { }

    findAll() {
        return this.repo.find({
            where: { deletedAt: IsNull() },
            relations: ['picking', 'lote'],
            order: { fechaRecepcion: 'DESC' },
        });
    }

    async findOne(id: string) {
        const devolucion = await this.repo.findOne({
            where: { id, deletedAt: IsNull() },
            relations: ['picking', 'lote'],
        });
        if (!devolucion) throw new NotFoundException('Devolución no encontrada');
        return devolucion;
    }

    async create(dto: CreateDevolucionDto, usuarioId: string) {
        const devolucion = this.repo.create({
            ...dto,
            usuarioRecibio: usuarioId,
            fechaRecepcion: new Date(),
        } as any);

        return this.repo.save(devolucion);
    }

    async procesar(id: string, dto: ProcesarDevolucionDto, usuarioId: string) {
        const devolucion = await this.findOne(id);

        if (devolucion.decisionInventario) {
            throw new BadRequestException('Esta devolución ya fue procesada');
        }

        devolucion.decisionInventario = dto.decisionInventario;
        devolucion.observaciones = dto.observaciones || devolucion.observaciones;
        devolucion.updatedAt = new Date();

        await this.repo.save(devolucion);

        if (dto.decisionInventario === 'REINGRESO' && dto.ubicacionDestino && devolucion.loteId) {
            const lote = await this.loteRepo.findOne({ where: { id: devolucion.loteId } });
            if (!lote) throw new BadRequestException('Lote no encontrado');

            let stock = await this.stockRepo.findOne({
                where: { ubicacionId: dto.ubicacionDestino, loteId: devolucion.loteId },
            });

            if (!stock) {
                stock = this.stockRepo.create({
                    ubicacionId: dto.ubicacionDestino,
                    loteId: devolucion.loteId,
                    cantidadFisica: 0,
                    cantidadReservada: 0,
                } as DeepPartial<StockUbicacion>);
            }

            stock.cantidadFisica = (Number(stock.cantidadFisica) + Number(devolucion.cantidadRecibida)) as any;
            await this.stockRepo.save(stock);

            await this.registrarKardex({
                tipoMovimiento: 'ENTRADA_DEVOLUCION',
                referenciaDocUuid: id,
                productoId: lote.productoId,
                loteId: devolucion.loteId,
                ubicacionDestino: dto.ubicacionDestino,
                cantidad: Number(devolucion.cantidadRecibida),
                saldoResultante: stock.cantidadFisica,
                usuarioResponsableId: usuarioId,
            });
        }

        return this.findOne(id);
    }

    async remove(id: string) {
        await this.findOne(id);
        await this.repo.update(id, { deletedAt: new Date(), updatedAt: new Date() } as any);
        return { id, deleted: true };
    }

    private async registrarKardex(data: Partial<KardexMovimiento>) {
        const kardex = this.kardexRepo.create(data as any);
        return this.kardexRepo.save(kardex);
    }
}
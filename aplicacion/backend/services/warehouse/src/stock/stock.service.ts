// stock/stock.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';

import { StockUbicacion } from './entities/stock-ubicacion.entity';
import { Ubicacion } from '../ubicaciones/entities/ubicacion.entity';
import { Lote } from '../lotes/entities/lote.entity';
import { KardexMovimiento } from '../kardex/entities/kardex-movimiento.entity';
import { CreateStockDto, UpdateStockDto, AjusteStockDto } from './dto/create-stock.dto';

@Injectable()
export class StockService {
    constructor(
        @InjectRepository(StockUbicacion)
        private readonly repo: Repository<StockUbicacion>,
        @InjectRepository(Ubicacion)
        private readonly ubicacionRepo: Repository<Ubicacion>,
        @InjectRepository(Lote)
        private readonly loteRepo: Repository<Lote>,
        @InjectRepository(KardexMovimiento)
        private readonly kardexRepo: Repository<KardexMovimiento>,
    ) { }

    findAll() {
        return this.repo
            .createQueryBuilder('s')
            .leftJoinAndSelect('s.ubicacion', 'u')
            .leftJoinAndSelect('s.lote', 'l')
            .where('s.cantidad_fisica > 0')
            .orderBy('s.ubicacion_id', 'ASC')
            .getMany();
    }

    async findByUbicacion(ubicacionId: string) {
        return this.repo.find({
            where: { ubicacionId },
            relations: ['lote'],
            order: { ultimaEntrada: 'DESC' },
        });
    }

    async findByProducto(productoId: string) {
        const stocks = await this.repo
            .createQueryBuilder('s')
            .innerJoinAndSelect('s.lote', 'l')
            .innerJoinAndSelect('s.ubicacion', 'u')
            .innerJoinAndSelect('u.almacen', 'a')
            .where('l.producto_id = :productoId', { productoId })
            .andWhere('s.cantidad_fisica > 0')
            .orderBy('l.fecha_vencimiento', 'ASC')
            .getMany();

        return stocks.map((s) => ({
            ...s,
            cantidadDisponible: Number(s.cantidadFisica) - Number(s.cantidadReservada),
        }));
    }

    async findOne(id: string) {
        const stock = await this.repo.findOne({ where: { id }, relations: ['ubicacion', 'lote'] });
        if (!stock) throw new NotFoundException('Stock no encontrado');
        return stock;
    }

    async create(dto: CreateStockDto, usuarioId?: string) {
        const ubicacion = await this.ubicacionRepo.findOne({ where: { id: dto.ubicacionId } });
        if (!ubicacion) throw new BadRequestException('Ubicación no encontrada');

        const lote = await this.loteRepo.findOne({ where: { id: dto.loteId } });
        if (!lote) throw new BadRequestException('Lote no encontrado');

        const existe = await this.repo.findOne({
            where: { ubicacionId: dto.ubicacionId, loteId: dto.loteId },
        });
        if (existe) throw new BadRequestException('Ya existe stock para este lote en esta ubicación');

        const toCreate: DeepPartial<StockUbicacion> = {
            ubicacionId: dto.ubicacionId,
            loteId: dto.loteId,
            lote,
            cantidadFisica: dto.cantidadFisica,
            cantidadReservada: 0,
        };

        const stock = this.repo.create(toCreate);
        const saved = await this.repo.save(stock);

        await this.registrarKardex({
            tipoMovimiento: 'ENTRADA_INICIAL',
            productoId: lote.productoId,
            loteId: dto.loteId,
            ubicacionDestino: dto.ubicacionId,
            cantidad: dto.cantidadFisica,
            saldoResultante: dto.cantidadFisica,
            usuarioResponsableId: usuarioId,
        });

        return saved;
    }

    async ajustarStock(dto: AjusteStockDto) {
        let stock = await this.repo.findOne({
            where: { ubicacionId: dto.ubicacionId, loteId: dto.loteId },
            relations: ['lote'],
        });

        if (!stock) {
            if (dto.cantidad < 0) throw new BadRequestException('No se puede reducir stock que no existe');

            const lote = await this.loteRepo.findOne({ where: { id: dto.loteId } });
            if (!lote) throw new BadRequestException('Lote no encontrado');

            const toCreate: DeepPartial<StockUbicacion> = {
                ubicacionId: dto.ubicacionId,
                loteId: dto.loteId,
                lote,
                cantidadFisica: dto.cantidad,
                cantidadReservada: 0,
            };

            stock = this.repo.create(toCreate);
        } else {
            const nuevaCantidad = Number(stock.cantidadFisica) + dto.cantidad;
            if (nuevaCantidad < 0) throw new BadRequestException('Cantidad física no puede ser negativa');
            stock.cantidadFisica = nuevaCantidad as any;
            stock.ultimaEntrada = new Date();
        }

        const saved = await this.repo.save(stock);

        await this.registrarKardex({
            tipoMovimiento: dto.cantidad > 0 ? 'ENTRADA_AJUSTE' : 'SALIDA_AJUSTE',
            productoId: stock.lote.productoId,
            loteId: dto.loteId,
            ubicacionDestino: dto.cantidad > 0 ? dto.ubicacionId : undefined,
            ubicacionOrigen: dto.cantidad < 0 ? dto.ubicacionId : undefined,
            cantidad: Math.abs(dto.cantidad),
            saldoResultante: saved.cantidadFisica,
            usuarioResponsableId: dto.usuarioResponsableId,
        });

        return saved;
    }

    async reservarStock(ubicacionId: string, loteId: string, cantidad: number) {
        const stock = await this.repo.findOne({ where: { ubicacionId, loteId } });
        if (!stock) throw new NotFoundException('Stock no encontrado');

        const disponible = Number(stock.cantidadFisica) - Number(stock.cantidadReservada);
        if (disponible < cantidad) throw new BadRequestException('Stock insuficiente para reservar');

        stock.cantidadReservada = (Number(stock.cantidadReservada) + cantidad) as any;
        return this.repo.save(stock);
    }

    async liberarReserva(ubicacionId: string, loteId: string, cantidad: number) {
        const stock = await this.repo.findOne({ where: { ubicacionId, loteId } });
        if (!stock) throw new NotFoundException('Stock no encontrado');

        stock.cantidadReservada = Math.max(0, Number(stock.cantidadReservada) - cantidad) as any;
        return this.repo.save(stock);
    }

    private async registrarKardex(data: Partial<KardexMovimiento>) {
        const kardex = this.kardexRepo.create(data as any);
        return this.kardexRepo.save(kardex);
    }
}
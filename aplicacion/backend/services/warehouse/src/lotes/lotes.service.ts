// lotes/lotes.service.ts
import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Lote } from './entities/lote.entity';
import { CreateLoteDto, UpdateLoteDto } from './dto/create-lote.dto';
import { ServiceHttpClient } from '../common/http/service-http-client.service';

@Injectable()
export class LotesService {
    private readonly logger = new Logger(LotesService.name);

    constructor(
        @InjectRepository(Lote)
        private readonly repo: Repository<Lote>,
        private readonly serviceHttp: ServiceHttpClient,
    ) { }

    async findAll() {
        const rows = await this.repo.find({ order: { fechaVencimiento: 'ASC' } });
        try {
            const ids = Array.from(new Set(rows.map(r => String(r.productoId)))).filter(Boolean);
            if (ids.length) {
                const products = await this.serviceHttp.post<any[]>(
                    'catalog-service',
                    '/products/internal/batch',
                    { ids },
                );
                const map = new Map<string, any>();
                (products || []).forEach(p => map.set(String(p.id), p));
                return rows.map(r => ({
                    ...r,
                    nombre_producto: map.get(String(r.productoId))?.nombre ?? null,
                }));
            }
        } catch (err) {
            this.logger.warn('No se pudo enriquecer lotes con nombre de producto', err?.message || String(err));
        }
        return rows;
    }

    async findByProducto(productoId: string) {
        const rows = await this.repo.find({
            where: { productoId },
            order: { fechaVencimiento: 'ASC' },
        });
        try {
            const products = await this.serviceHttp.post<any[]>(
                'catalog-service',
                '/products/internal/batch',
                { ids: [productoId] },
            );
            const prod = Array.isArray(products) && products.length ? products[0] : null;
            return rows.map(r => ({ ...r, nombre_producto: prod?.nombre ?? null }));
        } catch (err) {
            this.logger.warn('No se pudo enriquecer lotes por producto', err?.message || String(err));
            return rows;
        }
    }

    async findOne(id: string) {
        const lote = await this.repo.findOne({ where: { id } });
        if (!lote) throw new NotFoundException('Lote no encontrado');
        try {
            const products = await this.serviceHttp.post<any[]>(
                'catalog-service',
                '/products/internal/batch',
                { ids: [lote.productoId] },
            );
            const prod = Array.isArray(products) && products.length ? products[0] : null;
            return { ...lote, nombre_producto: prod?.nombre ?? null };
        } catch (err) {
            this.logger.warn('No se pudo enriquecer lote con nombre de producto', err?.message || String(err));
            return lote;
        }
    }

    async create(dto: CreateLoteDto) {
        const existe = await this.repo.findOne({
            where: { productoId: dto.productoId, numeroLote: dto.numeroLote },
        });
        if (existe) throw new BadRequestException('Ya existe un lote con ese número para este producto');

        const lote = this.repo.create(dto as any);
        return this.repo.save(lote);
    }

    async update(id: string, dto: UpdateLoteDto) {
        await this.findOne(id);
        await this.repo.update(id, { ...dto, updatedAt: new Date() } as any);
        return this.findOne(id);
    }

    async remove(id: string) {
        await this.findOne(id);
        await this.repo.delete(id);
        return { id, deleted: true };
    }
}
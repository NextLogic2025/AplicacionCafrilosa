// lotes/lotes.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Lote } from './entities/lote.entity';
import { CreateLoteDto, UpdateLoteDto } from './dto/create-lote.dto';

@Injectable()
export class LotesService {
    constructor(
        @InjectRepository(Lote)
        private readonly repo: Repository<Lote>,
    ) { }

    findAll() {
        return this.repo.find({ order: { fechaVencimiento: 'ASC' } });
    }

    findByProducto(productoId: string) {
        return this.repo.find({
            where: { productoId },
            order: { fechaVencimiento: 'ASC' },
        });
    }

    async findOne(id: string) {
        const lote = await this.repo.findOne({ where: { id } });
        if (!lote) throw new NotFoundException('Lote no encontrado');
        return lote;
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
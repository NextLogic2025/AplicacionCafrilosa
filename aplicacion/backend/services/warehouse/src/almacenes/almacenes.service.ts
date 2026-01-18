// almacenes/almacenes.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Almacen } from './entities/almacen.entity';
import { CreateAlmacenDto, UpdateAlmacenDto } from './dto/create-almacen.dto';

@Injectable()
export class AlmacenesService {
    constructor(
        @InjectRepository(Almacen)
        private readonly repo: Repository<Almacen>,
    ) { }

    findAll() {
        return this.repo.find({ where: { activo: true }, order: { id: 'ASC' } });
    }

    async findOne(id: number) {
        const almacen = await this.repo.findOne({ where: { id } });
        if (!almacen) throw new NotFoundException('Almacén no encontrado');
        return almacen;
    }

    create(dto: CreateAlmacenDto) {
        const almacen = this.repo.create(dto as any);
        return this.repo.save(almacen);
    }

    async update(id: number, dto: UpdateAlmacenDto) {
        await this.findOne(id);
        await this.repo.update(id, { ...dto, updatedAt: new Date() } as any);
        return this.findOne(id);
    }

    async remove(id: number) {
        await this.findOne(id);
        await this.repo.update(id, { activo: false, updatedAt: new Date() } as any);
        return { id, deleted: true };
    }

    findDeleted() {
        return this.repo.find({ where: { activo: false }, order: { id: 'ASC' } });
    }

    async restore(id: number) {
        const almacen = await this.repo.findOne({ where: { id } });
        if (!almacen) throw new NotFoundException('Almacén no encontrado');
        if (almacen.activo) return { id, restored: false, message: 'Ya activo' };
        await this.repo.update(id, { activo: true, updatedAt: new Date() } as any);
        return { id, restored: true };
    }
}
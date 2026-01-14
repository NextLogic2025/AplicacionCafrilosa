// ubicaciones/ubicaciones.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Ubicacion } from './entities/ubicacion.entity';
import { Almacen } from '../almacenes/entities/almacen.entity';
import { CreateUbicacionDto, UpdateUbicacionDto } from './dto/create-ubicacion.dto';

@Injectable()
export class UbicacionesService {
    constructor(
        @InjectRepository(Ubicacion)
        private readonly repo: Repository<Ubicacion>,
        @InjectRepository(Almacen)
        private readonly almacenRepo: Repository<Almacen>,
    ) { }

    findAll() {
        return this.repo.find({ relations: ['almacen'], order: { almacenId: 'ASC', codigoVisual: 'ASC' } });
    }

    findByAlmacen(almacenId: number) {
        return this.repo.find({ where: { almacenId }, relations: ['almacen'], order: { codigoVisual: 'ASC' } });
    }

    async findOne(id: string) {
        const ubicacion = await this.repo.findOne({ where: { id }, relations: ['almacen'] });
        if (!ubicacion) throw new NotFoundException('Ubicación no encontrada');
        return ubicacion;
    }

    async create(dto: CreateUbicacionDto) {
        const almacen = await this.almacenRepo.findOne({ where: { id: dto.almacenId } });
        if (!almacen) throw new BadRequestException('Almacén no encontrado');
        if (!almacen.activo) throw new BadRequestException('Almacén inactivo');

        const existe = await this.repo.findOne({
            where: { almacenId: dto.almacenId, codigoVisual: dto.codigoVisual },
        });
        if (existe) throw new BadRequestException('Ya existe una ubicación con ese código en este almacén');

        const ubicacion = this.repo.create(dto as any);
        return this.repo.save(ubicacion);
    }

    async update(id: string, dto: UpdateUbicacionDto) {
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
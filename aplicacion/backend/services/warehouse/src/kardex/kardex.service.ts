// kardex/kardex.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';

import { KardexMovimiento } from './entities/kardex-movimiento.entity';

@Injectable()
export class KardexService {
    constructor(
        @InjectRepository(KardexMovimiento)
        private readonly repo: Repository<KardexMovimiento>,
    ) { }

    findAll(fechaInicio?: string, fechaFin?: string) {
        const qb = this.repo.createQueryBuilder('k').orderBy('k.fecha', 'DESC').limit(100);

        if (fechaInicio && fechaFin) {
            qb.where('k.fecha BETWEEN :inicio AND :fin', { inicio: fechaInicio, fin: fechaFin });
        }

        return qb.getMany();
    }

    findByProducto(productoId: string, fechaInicio?: string, fechaFin?: string) {
        const qb = this.repo
            .createQueryBuilder('k')
            .where('k.producto_id = :productoId', { productoId })
            .orderBy('k.fecha', 'DESC');

        if (fechaInicio && fechaFin) {
            qb.andWhere('k.fecha BETWEEN :inicio AND :fin', { inicio: fechaInicio, fin: fechaFin });
        }

        return qb.getMany();
    }

    findByLote(loteId: string) {
        return this.repo.find({
            where: { loteId },
            order: { fecha: 'DESC' },
        });
    }

    findByTipo(tipoMovimiento: string, limit: number = 50) {
        return this.repo.find({
            where: { tipoMovimiento },
            order: { fecha: 'DESC' },
            take: limit,
        });
    }
}
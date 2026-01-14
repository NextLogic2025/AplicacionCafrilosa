import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AsignacionVendedores } from './entities/asignacion-vendedores.entity';

@Injectable()
export class AsignacionService {
  constructor(
    @InjectRepository(AsignacionVendedores)
    private repo: Repository<AsignacionVendedores>,
  ) {}

  findAll() {
    return this.repo.find();
  }

  async create(data: Partial<AsignacionVendedores>) {
    // If marking as principal, ensure there is no other active principal for the same zone
    if (data.es_principal) {
      const exists = await this.repo
        .createQueryBuilder('a')
        .where('a.zona_id = :zonaId', { zonaId: data.zona_id })
        .andWhere('a.fecha_fin IS NULL')
        .andWhere('a.es_principal = TRUE')
        .andWhere('a.deleted_at IS NULL')
        .getOne();

      if (exists) throw new BadRequestException('Ya existe un vendedor principal activo para esta zona');
    }

    const e = this.repo.create(data as Partial<AsignacionVendedores>);
    return this.repo.save(e);
  }

  async update(id: number, data: Partial<AsignacionVendedores>) {
    // If setting es_principal = true on update, ensure uniqueness for the zone
    if (data.es_principal) {
      const current = await this.findOne(id);
      const zonaId = current?.zona_id ?? data.zona_id;
      const other = await this.repo.createQueryBuilder('a')
        .where('a.zona_id = :zonaId', { zonaId })
        .andWhere('a.fecha_fin IS NULL')
        .andWhere('a.es_principal = TRUE')
        .andWhere('a.deleted_at IS NULL')
        .andWhere('a.id != :id', { id })
        .getOne();
      if (other) throw new BadRequestException('Ya existe un vendedor principal activo para esta zona');
    }

    await this.repo.update(id, data as any);
    return this.findOne(id);
  }

  findOne(id: number) {
    return this.repo.findOne({ where: { id } });
  }

  remove(id: number) {
    return this.repo.delete(id);
  }
}

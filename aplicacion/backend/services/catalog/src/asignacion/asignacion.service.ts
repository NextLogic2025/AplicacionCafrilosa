import { Injectable } from '@nestjs/common';
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

  create(data: Partial<AsignacionVendedores>) {
    const e = this.repo.create(data as any);
    return this.repo.save(e);
  }

  async update(id: number, data: Partial<AsignacionVendedores>) {
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

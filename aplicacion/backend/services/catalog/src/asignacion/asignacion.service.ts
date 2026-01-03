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

  remove(id: number) {
    return this.repo.delete(id);
  }
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ZonaComercial } from './entities/zona.entity';

@Injectable()
export class ZonasService {
  constructor(
    @InjectRepository(ZonaComercial)
    private repo: Repository<ZonaComercial>,
  ) {}

  findAll() {
    return this.repo.find();
  }

  findOne(id: number) {
    return this.repo.findOne({ where: { id } });
  }

  create(data: Partial<ZonaComercial>) {
    const ent = this.repo.create(data as any);
    return this.repo.save(ent);
  }

  async update(id: number, data: Partial<ZonaComercial>) {
    await this.repo.update(id, data as any);
    return this.findOne(id);
  }

  remove(id: number) {
    return this.repo.delete(id);
  }
}

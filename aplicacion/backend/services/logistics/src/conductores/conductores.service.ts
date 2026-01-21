import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conductor } from './entities/conductor.entity';

@Injectable()
export class ConductoresService {
  constructor(@InjectRepository(Conductor) private repo: Repository<Conductor>) {}

  findAll() {
    return this.repo.find({ where: { deleted_at: null } });
  }

  async findOne(id: string) {
    return this.repo.findOne({ where: { id, deleted_at: null } });
  }

  async create(dto: Partial<Conductor>) {
    const c = this.repo.create(dto as any);
    return this.repo.save(c);
  }

  async update(id: string, dto: Partial<Conductor>) {
    const c = await this.findOne(id);
    if (!c) throw new NotFoundException('Conductor no encontrado');
    Object.assign(c as any, dto);
    c.updated_at = new Date();
    return this.repo.save(c as any);
  }

  async remove(id: string) {
    await this.repo.update(id, { deleted_at: new Date() } as any);
    return { id, deleted: true };
  }
}

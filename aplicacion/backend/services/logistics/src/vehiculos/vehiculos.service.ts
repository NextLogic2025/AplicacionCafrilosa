import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vehiculo } from './entities/vehiculo.entity';

@Injectable()
export class VehiculosService {
  constructor(@InjectRepository(Vehiculo) private repo: Repository<Vehiculo>) {}

  findAll() {
    return this.repo.find({ where: { deleted_at: null } });
  }

  async findOne(id: string) {
    return this.repo.findOne({ where: { id, deleted_at: null } });
  }

  async create(dto: Partial<Vehiculo>) {
    const v = this.repo.create(dto as any);
    return this.repo.save(v);
  }

  async update(id: string, dto: Partial<Vehiculo>) {
    const v = await this.findOne(id);
    if (!v) throw new NotFoundException('Vehículo no encontrado');
    Object.assign(v as any, dto);
    v.updated_at = new Date();
    return this.repo.save(v as any);
  }

  async remove(id: string) {
    await this.repo.update(id, { deleted_at: new Date() } as any);
    return { id, deleted: true };
  }
}

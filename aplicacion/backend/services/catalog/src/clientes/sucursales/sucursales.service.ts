import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SucursalCliente } from './entities/sucursal.entity';
import { CreateSucursalDto } from './dto/create-sucursal.dto';
import { UpdateSucursalDto } from './dto/update-sucursal.dto';

@Injectable()
export class SucursalesService {
  constructor(
    @InjectRepository(SucursalCliente)
    private repo: Repository<SucursalCliente>,
  ) {}

  create(createDto: CreateSucursalDto) {
    const entity = this.repo.create(createDto as any);
    return this.repo.save(entity);
  }

  findAll(clienteId?: string) {
    const qb = this.repo.createQueryBuilder('s').where('s.activo = true');
    if (clienteId) qb.andWhere('s.cliente_id = :clienteId', { clienteId });
    return qb.getMany();
  }

  findDeactivated(clienteId?: string) {
    const qb = this.repo.createQueryBuilder('s').where('s.activo = false');
    if (clienteId) qb.andWhere('s.cliente_id = :clienteId', { clienteId });
    return qb.getMany();
  }

  findOne(id: string) {
    return this.repo.findOne({ where: { id } });
  }

  async update(id: string, updateDto: UpdateSucursalDto) {
    await this.repo.update(id, updateDto as any);
    return this.findOne(id);
  }

  async remove(id: string) {
    await this.repo.update(id, { activo: false } as any);
    return { id, deleted: true };
  }

  async activate(id: string) {
    await this.repo.update(id, { activo: true } as any);
    return this.findOne(id);
  }
}

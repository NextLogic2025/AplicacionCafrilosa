import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RuteroPlanificado } from './entities/rutero-planificado.entity';

@Injectable()
export class RuteroService {
  constructor(
    @InjectRepository(RuteroPlanificado)
    private repo: Repository<RuteroPlanificado>,
  ) {}

  findAll() {
    return this.repo.find({ where: { activo: true } });
  }

  findForCliente(clienteId: string) {
    return this.repo.find({ where: { cliente_id: clienteId, activo: true } });
  }

  findForVendedor(vendedorId: string) {
    return this.repo
      .createQueryBuilder('rp')
      .innerJoin('clientes', 'c', 'rp.cliente_id = c.id')
      .where('c.vendedor_asignado_id = :vendedorId', { vendedorId })
      .andWhere('rp.activo = :activo', { activo: true })
      .getMany();
  }

  create(data: Partial<RuteroPlanificado>) {
    const e = this.repo.create(data as any);
    return this.repo.save(e);
  }

  update(id: string, data: Partial<RuteroPlanificado>) {
    return this.repo
      .update(id, { ...(data as any), updated_at: new Date() })
      .then(() => this.repo.findOne({ where: { id } }));
  }

  remove(id: string) {
    return this.repo.update(id, { activo: false, updated_at: new Date() } as any);
  }
}

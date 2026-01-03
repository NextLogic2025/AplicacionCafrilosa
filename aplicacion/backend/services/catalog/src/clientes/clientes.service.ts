import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Cliente } from './entities/cliente.entity';

@Injectable()
export class ClientesService {
  constructor(
    @InjectRepository(Cliente)
    private repo: Repository<Cliente>,
  ) {}

  findAll() {
    return this.repo.find();
  }

  findOne(id: string) {
    return this.repo.findOne({ where: { id } });
  }

  findForVendedor(vendedorId: string) {
    return this.repo.find({ where: { vendedor_asignado_id: vendedorId } });
  }

  findByUsuarioPrincipalId(usuarioId: string) {
    return this.repo.findOne({ where: { usuario_principal_id: usuarioId } });
  }

  create(data: Partial<Cliente>) {
    const ent = this.repo.create(data as any);
    return this.repo.save(ent);
  }

  async update(id: string, data: Partial<Cliente>) {
    await this.repo.update(id, data as any);
    return this.findOne(id);
  }

  remove(id: string) {
    return this.repo.delete(id);
  }
}

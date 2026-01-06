import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Cliente } from './entities/cliente.entity';

@Injectable()
export class ClientesService {
  private readonly logger = new Logger(ClientesService.name);
  constructor(
    @InjectRepository(Cliente)
    private repo: Repository<Cliente>,
  ) {}

  findAll() {
    return this.repo.find({ where: { bloqueado: false } });
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
    this.logger.debug({ id, data });
    const cliente = await this.findOne(id);
    if (!cliente) throw new NotFoundException('Cliente no encontrado');

    // Apply only provided fields to avoid accidental overwrite
    Object.keys(data).forEach((k) => {
      // @ts-ignore
      cliente[k] = (data as any)[k];
    });

    // Update timestamp
    cliente.updated_at = new Date();

    const saved = await this.repo.save(cliente as any);
    this.logger.debug({ saved });
    return saved;
  }

  remove(id: string) {
    return this.repo.update(id, { bloqueado: true, updated_at: new Date() } as any);
  }

  findBlocked() {
    return this.repo.find({ where: { bloqueado: true } });
  }

  async unblock(id: string) {
    await this.repo.update(id, { bloqueado: false, deleted_at: null, updated_at: new Date() } as any);
    return this.findOne(id);
  }
}

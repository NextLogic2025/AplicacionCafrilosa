import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Cliente } from './entities/cliente.entity';

@Injectable()
export class ClientesService {
  private readonly logger = new Logger(ClientesService.name);
  // Simple in-memory cache for lookups by usuario_principal_id to reduce DB pressure.
  // TTL is short to allow quick propagation of changes (in milliseconds).
  private readonly _cache = new Map<string, { ts: number; value: Cliente | null }>();
  private readonly _cacheTtl = Number(process.env.CLIENTE_CACHE_TTL_MS || '300000'); // default 5 minutes
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
    if (!usuarioId) return Promise.resolve(null);

    const now = Date.now();
    const cached = this._cache.get(usuarioId);
    if (cached && now - cached.ts < this._cacheTtl) {
      this.logger.debug({ msg: 'Cache hit for cliente by usuario_principal_id', usuarioId, cached: !!cached.value });
      return Promise.resolve(cached.value);
    }
    this.logger.debug({ msg: 'Cache miss for cliente by usuario_principal_id', usuarioId });

    return this.repo.findOne({ where: { usuario_principal_id: usuarioId } }).then((res) => {
      this._cache.set(usuarioId, { ts: Date.now(), value: res });
      this.logger.debug({ msg: 'ClientesService.findByUsuarioPrincipalId fetched', usuarioId, found: !!res, clienteId: res ? (res as any).id : null, lista_precios_id: res ? (res as any).lista_precios_id : null });
      return res;
    });
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

import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

import { ZonaComercial } from '../zonas/entities/zona.entity';
import { AsignacionVendedores } from '../asignacion/entities/asignacion-vendedores.entity';

import { Cliente } from './entities/cliente.entity';


@Injectable()
export class ClientesService {
  private readonly logger = new Logger(ClientesService.name);
  // Simple in-memory cache for lookups by usuario_principal_id to reduce DB pressure.
  // TTL is short to allow quick propagation of changes (in milliseconds).
  private readonly _cache = new Map<string, { ts: number; value: Cliente | null }>();
  private readonly _cacheTtl = Number(process.env.CLIENTE_CACHE_TTL_MS || '300000'); // default 5 minutes
  private readonly usuariosServiceUrl = process.env.USUARIOS_SERVICE_URL || 'http://usuarios-service:3000';
  
  constructor(
    @InjectRepository(Cliente)
    private repo: Repository<Cliente>,
    @InjectRepository(ZonaComercial)
    private zonaRepo: Repository<ZonaComercial>,
    @InjectRepository(AsignacionVendedores)
    private asignRepo: Repository<AsignacionVendedores>,
    private httpService: HttpService,
  ) {}

  async findAll() {
    const clientes = await this.repo.find({ where: { bloqueado: false } });
    return this.enrichClientes(clientes);
  }

  async findOne(id: string) {
    const cliente = await this.repo.findOne({ where: { id } });
    if (!cliente) return null;
    const enriched = await this.enrichClientes([cliente]);
    return enriched[0];
  }

  async findForVendedor(vendedorId: string) {
    const clientes = await this.repo.find({ where: { vendedor_asignado_id: vendedorId, bloqueado: false } });
    return this.enrichClientes(clientes);
  }

  private async enrichClientes(clientes: Cliente[] | any[]) {
    if (!clientes.length) return clientes;
    let enriched = await this.enrichWithZonaNames(clientes);
    enriched = await this.enrichWithUsuarioNames(enriched);
    enriched = await this.enrichWithVendedorNames(enriched);
    return enriched;
  }

  private async enrichWithZonaNames(clientes: Cliente[]) {
    if (!clientes.length) return clientes;
    const zonaIds = [...new Set(clientes.map(c => c.zona_comercial_id).filter(Boolean))];
    if (!zonaIds.length) return clientes;
    
    const zonas = await this.zonaRepo.find({ where: zonaIds.map(id => ({ id })) });
    const zonaMap = new Map(zonas.map(z => [z.id, z.nombre]));
    
    return clientes.map(c => ({
      ...c,
      zona_comercial_nombre: c.zona_comercial_id ? zonaMap.get(c.zona_comercial_id) : null
    }));
  }

  private async enrichWithUsuarioNames(clientes: any[]) {
    if (!clientes.length) return clientes;
    const usuarioIds = [...new Set(clientes.map(c => c.usuario_principal_id).filter(Boolean))];
    if (!usuarioIds.length) return clientes;
    
    try {
      // Fetch usuario names from usuarios service
      const response = await firstValueFrom(
        this.httpService.post(`${this.usuariosServiceUrl}/usuarios/batch/internal`, { ids: usuarioIds })
      );
      const usuarios = response.data || [];
      const usuarioMap = new Map<string, { nombre: string; telefono: string | null }>(
        usuarios.map((u: any) => [u.id, {
          nombre: (u.nombreCompleto ?? u.nombre) || u.email,
          telefono: u.telefono || null
        }])
      );
      
      return clientes.map(c => ({
        ...c,
        usuario_principal_nombre: c.usuario_principal_id ? usuarioMap.get(c.usuario_principal_id)?.nombre : null,
        usuario_principal_telefono: c.usuario_principal_id ? usuarioMap.get(c.usuario_principal_id)?.telefono : null
      }));
    } catch (error) {
      this.logger.warn({ msg: 'Failed to fetch usuario names', error: error.message });
      return clientes; // Return without usuario names if service unavailable
    }
  }

  private async enrichWithVendedorNames(clientes: any[]) {
    if (!clientes.length) return clientes;
    const vendedorIds = [...new Set(clientes.map(c => c.vendedor_asignado_id).filter(Boolean))];
    if (!vendedorIds.length) return clientes;

    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.usuariosServiceUrl}/usuarios/batch/internal`, { ids: vendedorIds })
      );
      const usuarios = response.data || [];
      const vendedorMap = new Map(usuarios.map(u => [u.id, (u.nombreCompleto ?? u.nombre) || u.email]));

      return clientes.map(c => ({
        ...c,
        vendedor_nombre: c.vendedor_asignado_id ? vendedorMap.get(c.vendedor_asignado_id) : null,
      }));
    } catch (error) {
      this.logger.warn({ msg: 'Failed to fetch vendedor names', error: error.message });
      return clientes;
    }
  }

  findByUsuarioPrincipalId(usuarioId: string) {
    if (!usuarioId) return Promise.resolve(null);

    const now = Date.now();
    const cached = this._cache.get(usuarioId);
    if (cached && now - cached.ts < this._cacheTtl) {
      return Promise.resolve(cached.value);
    }

    return this.repo.findOne({ where: { usuario_principal_id: usuarioId } }).then(async (res) => {
      if (!res) return res;
      const enriched = await this.enrichClientes([res]);
      const enrichedCliente = enriched[0];
      this._cache.set(usuarioId, { ts: Date.now(), value: enrichedCliente });
      return enrichedCliente;
    });
  }

  async create(data: Partial<Cliente>) {
    let vendedorId = data.vendedor_asignado_id ?? null;
    if (!vendedorId && data.zona_comercial_id) {
      const asign = await this.asignRepo
        .createQueryBuilder('a')
        .where('a.zona_id = :zona', { zona: data.zona_comercial_id })
        .andWhere('a.es_principal = TRUE')
        .andWhere('a.fecha_fin IS NULL')
        .andWhere('a.deleted_at IS NULL')
        .orderBy('a.fecha_inicio', 'DESC')
        .getOne();
      vendedorId = asign?.vendedor_usuario_id ?? vendedorId;
    }
    const ent = this.repo.create({ ...(data as any), vendedor_asignado_id: vendedorId } as any);
    return this.repo.save(ent);
  }

  async update(id: string, data: Partial<Cliente>) {
    const cliente = await this.findOne(id);
    if (!cliente) throw new NotFoundException('Cliente no encontrado');

    // Apply only provided fields to avoid accidental overwrite
    Object.keys(data).forEach((k) => {
     
      cliente[k] = (data as any)[k];
    });

    // Update timestamp
    cliente.updated_at = new Date();

    return this.repo.save(cliente as any);
  }

  remove(id: string) {
    return this.repo.update(id, { bloqueado: true, updated_at: new Date() } as any);
  }

  async findBlocked() {
    const clientes = await this.repo.find({ where: { bloqueado: true } });
    return this.enrichClientes(clientes);
  }

  async unblock(id: string) {
    await this.repo.update(id, { bloqueado: false, deleted_at: null, updated_at: new Date() } as any);
    return this.findOne(id);
  }
}

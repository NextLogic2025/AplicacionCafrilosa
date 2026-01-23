import { Injectable, NotFoundException, Logger, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ZonaComercial } from '../zonas/entities/zona.entity';
import { AsignacionVendedores } from '../asignacion/entities/asignacion-vendedores.entity';
import { Cliente } from './entities/cliente.entity';
import { CreateClienteDto, UpdateClienteDto } from './dto/create-cliente.dto';
import { SucursalesService } from './sucursales/sucursales.service';
import { UsuariosExternalService } from '../common/external/usuarios.external.service';

// Interfaz interna para respuesta de Usuarios Service
interface UsuarioExterno {
  id: string;
  nombre?: string;
  nombreCompleto?: string;
  email: string;
  telefono?: string;
}

@Injectable()
export class ClientesService {
  private readonly logger = new Logger(ClientesService.name);
  
  // Cache simple
  private readonly _cache = new Map<string, { ts: number; value: Cliente | null }>();
  private readonly _cacheTtl = Number(process.env.CLIENTE_CACHE_TTL_MS || '300000');
  constructor(
    @InjectRepository(Cliente)
    private repo: Repository<Cliente>,
    @InjectRepository(ZonaComercial)
    private zonaRepo: Repository<ZonaComercial>,
    @InjectRepository(AsignacionVendedores)
    private asignRepo: Repository<AsignacionVendedores>,
    @Inject(forwardRef(() => SucursalesService))
    private readonly sucursalesService: SucursalesService,
    private readonly usuariosExternal: UsuariosExternalService,
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

  /**
   * Lógica de creación con Auto-Asignación de Vendedor
   */
  async create(dto: CreateClienteDto) {
    let vendedorId: string | null = null;

    // Si tiene zona, buscamos el vendedor principal de esa zona
    if (dto.zona_comercial_id) {
      const asign = await this.asignRepo
        .createQueryBuilder('a')
        .where('a.zona_id = :zona', { zona: dto.zona_comercial_id })
        .andWhere('a.es_principal = TRUE')
        .andWhere('a.fecha_fin IS NULL')
        .andWhere('a.deleted_at IS NULL')
        .orderBy('a.fecha_inicio', 'DESC')
        .getOne();
      
      if (asign) {
          vendedorId = asign.vendedor_usuario_id;
          this.logger.log(`Vendedor ${vendedorId} auto-asignado al nuevo cliente por zona ${dto.zona_comercial_id}`);
      }
    }

    const nuevoCliente = this.repo.create({
      ...dto,
      vendedor_asignado_id: vendedorId,
    } as any);

    const savedResult = await this.repo.save(nuevoCliente);
    const saved = Array.isArray(savedResult) ? savedResult[0] : savedResult;

    // Si vienen sucursales en el DTO, crear cada una vinculada al cliente.
    if (dto.sucursales && Array.isArray(dto.sucursales) && dto.sucursales.length) {
      for (const s of dto.sucursales) {
        const createSucursal: any = {
          cliente_id: saved.id,
          nombre_sucursal: (s as any).nombre_sucursal || (s as any).nombre,
          direccion_entrega: (s as any).direccion_entrega || (s as any).direccion_texto,
          contacto_nombre: (s as any).contacto_nombre || (s as any).contacto,
          contacto_telefono: (s as any).contacto_telefono || (s as any).telefono,
          zona_id: (s as any).zona_id || (s as any).zona_comercial_id,
          activo: (s as any).activo !== undefined ? (s as any).activo : true,
          ubicacion_gps: (s as any).ubicacion_gps,
        };

        try {
          await this.sucursalesService.create(createSucursal);
        } catch (err) {
          this.logger.warn(`Error creando sucursal para cliente ${saved.id}: ${err.message}`);
        }
      }
    }

    return this.findOne(saved.id);
  }

  /**
   * Update seguro usando DTOs
   */
  async update(id: string, dto: UpdateClienteDto) {
    const cliente = await this.repo.findOne({ where: { id } });
    if (!cliente) throw new NotFoundException('Cliente no encontrado');

    // Mapeo manual seguro o Object.assign controlado
    Object.assign(cliente, dto as any);

    // No hay campos financieros en el esquema actual; actualizamos con campos del DTO normalmente

    cliente.updated_at = new Date();
    
    const saved = await this.repo.save(cliente);
    this.logger.log(`Cliente actualizado: ${id}`);
    
    // Invalidamos caché si existía
    if (cliente.usuario_principal_id) {
        this._cache.delete(cliente.usuario_principal_id);
    }

    return saved;
  }

  // --- Métodos de Enriquecimiento (Privados) ---
  // Se mantienen similares pero tipados

  private async enrichClientes(clientes: Cliente[]) {
    if (!clientes.length) return clientes;
    let enriched = await this.enrichWithZonaNames(clientes);
    enriched = await this.enrichWithUsuarioNames(enriched);
    enriched = await this.enrichWithVendedorNames(enriched);
    return enriched;
  }

  private async enrichWithZonaNames(clientes: Cliente[]) {
    const zonaIds = [...new Set(clientes.map(c => c.zona_comercial_id).filter(Boolean))];
    if (!zonaIds.length) return clientes;
    
    const zonas = await this.zonaRepo.find({ where: zonaIds.map(id => ({ id })) });
    const zonaMap = new Map(zonas.map(z => [z.id, z.nombre]));
    
    return clientes.map(c => ({
      ...c,
      zona_comercial_nombre: c.zona_comercial_id ? zonaMap.get(c.zona_comercial_id) : null
    }));
  }

  private async enrichWithUsuarioNames(clientes: Cliente[]) {
    const usuarioIds = [...new Set(clientes.map(c => c.usuario_principal_id).filter(Boolean))];
    if (!usuarioIds.length) return clientes;
    
      try {
      const usuarios = await await this.usuariosExternal.fetchUsuariosByIds(usuarioIds);
      const usuarioMap = new Map(
        usuarios.map(u => [u.id, {
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
      this.logger.warn(`Error obteniendo nombres de usuarios: ${error.message}`);
      return clientes;
    }
  }

  private async enrichWithVendedorNames(clientes: Cliente[]) {
    const vendedorIds = [...new Set(clientes.map(c => c.vendedor_asignado_id).filter(Boolean))];
    if (!vendedorIds.length) return clientes;

    try {
       const usuarios = await await this.usuariosExternal.fetchUsuariosByIds(vendedorIds);
      const vendedorMap = new Map(usuarios.map(u => [u.id, (u.nombreCompleto ?? u.nombre) || u.email]));

      return clientes.map(c => ({
        ...c,
        vendedor_nombre: c.vendedor_asignado_id ? vendedorMap.get(c.vendedor_asignado_id) : null,
      }));
    } catch (error) {
      this.logger.warn(`Error obteniendo nombres de vendedores: ${error.message}`);
      return clientes;
    }
  }

  // ... Resto de métodos (findByUsuarioPrincipalId, remove, unblock) se mantienen igual lógica pero con tipos
  
  findByUsuarioPrincipalId(usuarioId: string) {
      if (!usuarioId) return Promise.resolve(null);
      const now = Date.now();
      const cached = this._cache.get(usuarioId);
      if (cached && now - cached.ts < this._cacheTtl) return Promise.resolve(cached.value);

      return this.repo.findOne({ where: { usuario_principal_id: usuarioId } }).then(async (res) => {
        if (!res) return res;
        const enriched = await this.enrichClientes([res]);
        const enrichedCliente = enriched[0];
        this._cache.set(usuarioId, { ts: Date.now(), value: enrichedCliente });
        return enrichedCliente;
      });
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

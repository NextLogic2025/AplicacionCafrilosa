import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Cliente } from '../clientes/entities/cliente.entity';
import { SucursalCliente } from '../clientes/sucursales/entities/sucursal.entity';

import { RuteroPlanificado } from './entities/rutero-planificado.entity';

@Injectable()
export class RuteroService {
  constructor(
    @InjectRepository(RuteroPlanificado)
    private repo: Repository<RuteroPlanificado>,
    @InjectRepository(Cliente)
    private clienteRepo: Repository<Cliente>,
    @InjectRepository(SucursalCliente)
    private sucursalRepo: Repository<SucursalCliente>,
  ) {}

  async findAll() {
    const ruteros = await this.repo.find({ where: { activo: true } });
    return this.enrichRuteros(ruteros);
  }

  async findForCliente(clienteId: string) {
    const ruteros = await this.repo.find({ where: { cliente_id: clienteId, activo: true } });
    return this.enrichRuteros(ruteros);
  }

  async findForVendedor(vendedorId: string) {
    const ruteros = await this.repo
      .createQueryBuilder('rp')
      .innerJoin('asignacion_vendedores', 'av', 'av.zona_id = rp.zona_id')
      .where('av.vendedor_usuario_id = :vendedorId', { vendedorId })
      .andWhere('av.fecha_fin IS NULL')
      .andWhere('av.deleted_at IS NULL')
      .andWhere('rp.activo = :activo', { activo: true })
      .orderBy('rp.dia_semana', 'ASC')
      .addOrderBy('rp.orden_sugerido', 'ASC')
      .getMany();

    return this.enrichRuteros(ruteros);
  }

  private async enrichRuteros(ruteros: RuteroPlanificado[]) {
    if (!ruteros.length) return ruteros;

    const clienteIds = [...new Set(ruteros.map(r => r.cliente_id))];
    const sucursalIds = [...new Set(ruteros.map(r => r.sucursal_id).filter(Boolean))];

    const clientes = await this.clienteRepo.findByIds(clienteIds);
    const clienteMap = new Map(clientes.map(c => [c.id, c]));

    let sucursalMap = new Map<string, SucursalCliente>();
    if (sucursalIds.length > 0) {
      const sucursales = await this.sucursalRepo.findByIds(sucursalIds);
      sucursalMap = new Map(sucursales.map(s => [s.id, s]));
    }

    // Obtener datos de usuarios para contacto de matriz
    const usuarioIds = [...new Set(clientes.map(c => c.usuario_principal_id).filter(Boolean))];
    let usuarioMap = new Map<string, { nombre: string; telefono: string | null }>();
    if (usuarioIds.length > 0) {
      try {
        const response = await fetch(`${process.env.USUARIOS_SERVICE_URL || 'http://usuarios-service:3000'}/usuarios/batch/internal`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: usuarioIds })
        });
        const usuarios = await response.json();
        usuarioMap = new Map(usuarios.map(u => [u.id, {
          nombre: (u.nombreCompleto ?? u.nombre) || u.email,
          telefono: u.telefono || null
        }]));
      } catch (error) {
        console.warn('Failed to fetch usuario data for rutero enrichment:', error);
      }
    }

    return ruteros.map(r => {
      const cliente = clienteMap.get(r.cliente_id);
      const sucursal = r.sucursal_id ? sucursalMap.get(r.sucursal_id) : null;
      const usuario = cliente?.usuario_principal_id ? usuarioMap.get(cliente.usuario_principal_id) : null;

      return {
        ...r,
        cliente_nombre: cliente?.razon_social || cliente?.nombre_comercial,
        cliente_identificacion: cliente?.identificacion,
        // Si hay sucursal, usar datos de sucursal; si no, usar dirección matriz del cliente
        direccion_entrega: sucursal?.direccion_entrega || cliente?.direccion_texto,
        ubicacion_gps: sucursal?.ubicacion_gps || cliente?.ubicacion_gps,
        sucursal_nombre: sucursal?.nombre_sucursal || 'Matriz',
        // Si hay sucursal, usar contacto de sucursal; si no, usar datos del usuario principal
        contacto_nombre: sucursal?.contacto_nombre || usuario?.nombre || null,
        contacto_telefono: sucursal?.contacto_telefono || usuario?.telefono || null,
      };
    });
  }

  async create(data: Partial<RuteroPlanificado>) {
    let zonaId = data.zona_id;
    if (!zonaId) {
      if (data.sucursal_id) {
        const suc = await this.sucursalRepo.findOne({ where: { id: data.sucursal_id as any } });
        zonaId = suc?.zona_id ?? zonaId;
      } else if (data.cliente_id) {
        const cli = await this.clienteRepo.findOne({ where: { id: data.cliente_id as any } });
        zonaId = cli?.zona_comercial_id ?? zonaId;
      }
    }
    const e = this.repo.create({ ...(data as any), zona_id: zonaId } as any);
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

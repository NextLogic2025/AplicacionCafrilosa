import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';

import { CampaniaPromocional } from './entities/campania.entity';
import { ProductoPromocion } from './entities/producto-promocion.entity';
import { PromocionClientePermitido } from './entities/promocion-cliente-permitido.entity';
import { PreciosService } from '../precios/precios.service';

@Injectable()
export class PromocionesService {
  constructor(
    @InjectRepository(CampaniaPromocional)
    private campRepo: Repository<CampaniaPromocional>,
    @InjectRepository(ProductoPromocion)
    private prodPromoRepo: Repository<ProductoPromocion>,
    @InjectRepository(PromocionClientePermitido)
    private clientePromoRepo: Repository<PromocionClientePermitido>,
    @Inject(forwardRef(() => PreciosService))
    private preciosService: PreciosService,
  ) {}

  // Devuelve promociones aplicables a una lista de productos para un cliente/lista específica
  async findPromosForCliente(productIds: string[], clienteId?: string, listaId?: number) {
    if (!productIds || productIds.length === 0) return [];

    const promos = await this.prodPromoRepo.find({ where: { producto_id: In(productIds) }, relations: ['campania'] });

    const result: ProductoPromocion[] = [];
    for (const p of promos) {
      const camp = p.campania as any as CampaniaPromocional;
      if (!camp || !camp.activo || camp.deleted_at) continue;

      // alcance: GLOBAL | POR_LISTA | POR_CLIENTE
      const alcance = (camp.alcance || 'GLOBAL').toString().toUpperCase();
      if (alcance === 'GLOBAL') {
        result.push(p);
        continue;
      }
      if (alcance === 'POR_LISTA') {
        if (listaId && camp.lista_precios_objetivo_id === listaId) result.push(p);
        continue;
      }
      if (alcance === 'POR_CLIENTE') {
        if (!clienteId) continue;
        const permit = await this.clientePromoRepo.findOne({ where: { campania_id: camp.id, cliente_id: clienteId } });
        if (permit) result.push(p);
        continue;
      }
    }

    return result;
  }

  // ===== CAMPAÑAS CRUD =====
  findCampanias(includeDeleted = false) {
    const qb = this.campRepo.createQueryBuilder('c');
    if (!includeDeleted) qb.where('c.deleted_at IS NULL');
    return qb.getMany();
  }

  findCampania(id: number) {
    return this.campRepo.findOne({ where: { id, deleted_at: null } });
  }

  createCampania(data: Partial<CampaniaPromocional>) {
    const e = this.campRepo.create(data as any);
    return this.campRepo.save(e);
  }

  async updateCampania(id: number, data: Partial<CampaniaPromocional>) {
    const camp = await this.findCampania(id);
    if (!camp) throw new NotFoundException('Campaña no encontrada');
    await this.campRepo.update(id, data as any);
    return this.findCampania(id);
  }

  async removeCampania(id: number) {
    const camp = await this.findCampania(id);
    if (!camp) throw new NotFoundException('Campaña no encontrada');
    await this.campRepo.update(id, { deleted_at: new Date(), activo: false } as any);
    return { id, deleted: true };
  }

  // ===== PRODUCTOS EN CAMPAÑA =====
  async addProductoPromo(data: Partial<ProductoPromocion>) {
    const camp = await this.campRepo.findOne({ where: { id: data.campania_id, deleted_at: null } });
    if (!camp) throw new NotFoundException('Campaña no encontrada o eliminada');
    if (!camp.activo) throw new NotFoundException('Campaña está desactivada');
    const e = this.prodPromoRepo.create(data as any);
    return this.prodPromoRepo.save(e);
  }

  findPromosByCampania(campaniaId: number) {
    return this.prodPromoRepo.find({
      where: { campania_id: campaniaId },
      relations: ['producto', 'producto.categoria', 'campania'],
    });
  }

  async removeProductoPromo(campaniaId: number, productoId: string) {
    const res = await this.prodPromoRepo.delete({ campania_id: campaniaId, producto_id: productoId } as any);
    if (!res.affected) throw new NotFoundException('Producto no encontrado en campaña');
    return { campaniaId, productoId, deleted: true };
  }

  // ===== CLIENTES PERMITIDOS (para alcance POR_CLIENTE) =====
  async addClientePermitido(campaniaId: number, clienteId: string) {
    const camp = await this.campRepo.findOne({ where: { id: campaniaId, deleted_at: null } });
    if (!camp) throw new NotFoundException('Campaña no encontrada o eliminada');
    if (!camp.activo) throw new NotFoundException('Campaña está desactivada');
    const e = this.clientePromoRepo.create({ campania_id: campaniaId, cliente_id: clienteId } as any);
    return this.clientePromoRepo.save(e);
  }

  findClientesPermitidos(campaniaId: number) {
    return this.clientePromoRepo.find({ where: { campania_id: campaniaId } });
  }

  async removeClientePermitido(campaniaId: number, clienteId: string) {
    const res = await this.clientePromoRepo.delete({ campania_id: campaniaId, cliente_id: clienteId } as any);
    if (!res.affected) throw new NotFoundException('Cliente no encontrado en campaña');
    return { campaniaId, clienteId, deleted: true };
  }

  // Devuelve la mejor promoción (la que genera menor precio final) para un producto
  async getBestPromotionForProduct(productId: string, opts: { clienteId?: string; listaId?: number } = {}) {
    // Cargar todas las promociones del producto
    const promos = await this.prodPromoRepo.find({ where: { producto_id: productId }, relations: ['campania', 'producto'] });

    if (!promos || promos.length === 0) return null;

    const aplicables: { promo: ProductoPromocion; precio_lista: number; precio_final: number }[] = [];

    // Obtener precio base (preferir lista específica si se indica)
    let preciosRaw: any[] = [];
    if (opts.listaId) {
      preciosRaw = await this.preciosService.obtenerPreciosDeProductoParaLista(productId, opts.listaId);
    } else {
      preciosRaw = await this.preciosService.obtenerPreciosDeProducto(productId);
    }

    const precioOriginal = preciosRaw && preciosRaw.length ? Math.min(...preciosRaw.map(p => Number(p.precio))) : null;

    for (const p of promos) {
      const camp = p.campania as any as CampaniaPromocional;
      if (!camp || !camp.activo || camp.deleted_at) continue;

      // Validar alcance
      const alcance = (camp.alcance || 'GLOBAL').toString().toUpperCase();
      if (alcance === 'POR_LISTA' && opts.listaId && camp.lista_precios_objetivo_id !== opts.listaId) continue;
      if (alcance === 'POR_CLIENTE' && opts.clienteId) {
        const permit = await this.clientePromoRepo.findOne({ where: { campania_id: camp.id, cliente_id: opts.clienteId } });
        if (!permit) continue;
      }

      // Calcular precio oferta
      let precioOferta: number | null = null;
      if (precioOriginal != null) {
        if (p.precio_oferta_fijo != null) precioOferta = Number(p.precio_oferta_fijo);
        else if (camp) {
          const tipo = (camp.tipo_descuento || '').toString().toUpperCase();
          const valor = Number(camp.valor_descuento || 0);
          if (tipo === 'PORCENTAJE') precioOferta = +(precioOriginal * (1 - valor / 100));
          else if (tipo === 'MONTO_FIJO') precioOferta = +(precioOriginal - valor);
        }
        if (precioOferta != null) {
          if (precioOferta < 0) precioOferta = 0;
          precioOferta = Math.round(precioOferta * 100) / 100;
        }
      }

      if (precioOferta != null) {
        aplicables.push({ promo: p, precio_lista: precioOriginal ?? 0, precio_final: precioOferta });
      }
    }

    if (!aplicables.length) return null;

    // Elegir la que tenga menor precio_final
    aplicables.sort((a, b) => a.precio_final - b.precio_final);
    const best = aplicables[0];

    const campany: any = best.promo.campania || {};
    return {
      producto_id: productId,
      campania_id: best.promo.campania_id,
      precio_lista: best.precio_lista,
      precio_final: best.precio_final,
      tipo_descuento: campany.tipo_descuento ?? null,
      valor_descuento: campany.valor_descuento ?? null,
      vigente_desde: campany.vigente_desde ?? null,
      vigente_hasta: campany.vigente_hasta ?? null,
    };
  }
}

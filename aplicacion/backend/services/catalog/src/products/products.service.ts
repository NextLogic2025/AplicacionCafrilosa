import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Not, IsNull } from 'typeorm';

import { PrecioItem } from '../precios/entities/precio.entity';
import { ProductoPromocion } from '../promociones/entities/producto-promocion.entity';
import { Category } from '../categories/entities/category.entity';

import { Product } from './entities/product.entity';

type FindOptions = {
  page?: number;
  per_page?: number;
  q?: string;
  role?: string[];
  userId?: string;
  clienteListaId?: number | null;
};

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly repo: Repository<Product>
  ) {}

  // NOTE: Inject other repos via manager when needed using getRepository inside methods.

  async findAll(opts: FindOptions = {}) {
    const page = opts.page && opts.page > 0 ? opts.page : 1;
    const per_page = opts.per_page && opts.per_page > 0 ? opts.per_page : 20;
    const qb = this.repo.createQueryBuilder('p').where('p.deleted_at IS NULL').andWhere('p.activo = TRUE');
    if (opts.q) {
      qb.andWhere('(p.nombre ILIKE :q OR p.codigo_sku ILIKE :q)', { q: `%${opts.q}%` });
    }

    const [items, total] = await qb.skip((page - 1) * per_page).take(per_page).getManyAndCount();

    // load categories map
    const categoriaIds = Array.from(new Set(items.map((i) => i.categoria_id).filter(Boolean)));
    const categoryRepo = this.repo.manager.getRepository(Category);
    const categorias = categoriaIds.length ? await categoryRepo.findBy(categoriaIds.map((id) => ({ id } as any))) : [];
    const catMap = new Map(categorias.map((c: any) => [c.id, { id: c.id, nombre: c.nombre }]));

    // prepare product ids
    const productIds = items.map((p) => p.id);

    // load prices depending on role / clienteListaId
    const precioRepo = this.repo.manager.getRepository(PrecioItem);
    let precios: PrecioItem[] = [];
    if (opts.role && opts.role.includes('cliente') && opts.clienteListaId) {
      precios = await precioRepo.find({ where: { lista_id: opts.clienteListaId, producto_id: In(productIds) } });
    } else {
      // for admin/supervisor/vendedor load all prices for the page products
      precios = await precioRepo.find({ where: { producto_id: In(productIds) } });
    }

    // load promotions
    const promoRepo = this.repo.manager.getRepository(ProductoPromocion);
    const promos = await promoRepo.find({ where: { producto_id: In(productIds) }, relations: ['campania'] });

    // assemble items applying role-based field visibility
    const resultItems = items.map((p) => {
      const base: any = {
        id: p.id,
        codigo_sku: p.codigo_sku,
        nombre: p.nombre,
      };

      // fields visible to admin/supervisor/vendedor/cliente
      const showFull = opts.role && (opts.role.includes('admin') || opts.role.includes('supervisor') || opts.role.includes('vendedor') || opts.role.includes('cliente'));
      if (showFull) {
        base.descripcion = p.descripcion;
        base.categoria = p.categoria_id ? catMap.get(p.categoria_id) ?? null : null;
        base.peso_unitario_kg = parseFloat(String(p.peso_unitario_kg));
        base.volumen_m3 = p.volumen_m3 ? parseFloat(String(p.volumen_m3)) : null;
        base.requiere_frio = p.requiere_frio;
        base.unidad_medida = p.unidad_medida;
        base.imagen_url = p.imagen_url;
        base.activo = p.activo;
      }

      // bodeguero: limited fields (stock-related)
      if (opts.role && opts.role.includes('bodeguero')) {
        // keep only stock/logistics fields
        base.descripcion = undefined;
        base.categoria = undefined;
        // ensure weight/volume/unit exist
        base.peso_unitario_kg = parseFloat(String(p.peso_unitario_kg));
        base.volumen_m3 = p.volumen_m3 ? parseFloat(String(p.volumen_m3)) : null;
        base.unidad_medida = p.unidad_medida;
        base.activo = p.activo;
      }

      // prices
      const productPrices = precios.filter((pr) => pr.producto_id === p.id).map((pr) => ({ lista_id: pr.lista_id, precio: Number(pr.precio) }));
      if (opts.role && opts.role.includes('bodeguero')) {
        // bodeguero doesn't see prices
      } else {
        base.precios = productPrices;
      }

      // promotions: include only promotions that have a fixed offer price
      const prodPromos = promos
        .filter((pr) => pr.producto_id === p.id)
        .map((pr) => ({ campana_id: pr.campania_id, precio_oferta: pr.precio_oferta_fijo }))
        .filter((pp: any) => pp.precio_oferta != null);
      base.promociones = prodPromos;

      return base;
    });

    const total_pages = Math.ceil(total / per_page);
    return {
      metadata: { total_items: total, page, per_page, total_pages },
      items: resultItems,
    };
  }

  findDeleted() {
    return this.repo.find({ where: { deleted_at: Not(IsNull()) } });
  }

  async restore(id: string) {
    await this.repo.update(id, { deleted_at: null, activo: true } as any);
    return this.findOne(id);
  }

  async productosConPrecioParaLista(listaId: number, opts: FindOptions = {}) {
    const page = opts.page && opts.page > 0 ? opts.page : 1;
    const per_page = opts.per_page && opts.per_page > 0 ? opts.per_page : 20;
    const precioRepo = this.repo.manager.getRepository(PrecioItem);
    const rows = await precioRepo.find({ where: { lista_id: listaId } });
    const productIds = rows.map((r) => r.producto_id);
    if (!productIds.length) return { metadata: { total_items: 0, page, per_page, total_pages: 0 }, items: [] };

    const qb = this.repo.createQueryBuilder('p').where('p.deleted_at IS NULL').andWhere('p.activo = TRUE').andWhere('p.id IN (:...ids)', { ids: productIds });
    if (opts.q) qb.andWhere('(p.nombre ILIKE :q OR p.codigo_sku ILIKE :q)', { q: `%${opts.q}%` });
    const [items, total] = await qb.skip((page - 1) * per_page).take(per_page).getManyAndCount();

    // reuse assembly logic: load categories and prices for these items
    const categoriaIds = Array.from(new Set(items.map((i) => i.categoria_id).filter(Boolean)));
    const categoryRepo = this.repo.manager.getRepository(Category);
    const categorias = categoriaIds.length ? await categoryRepo.findBy(categoriaIds.map((id) => ({ id } as any))) : [];
    const catMap = new Map(categorias.map((c: any) => [c.id, { id: c.id, nombre: c.nombre }]));

    const precioRows = await precioRepo.find({ where: { lista_id: listaId, producto_id: In(items.map((p) => p.id)) } });
    const promoRepo = this.repo.manager.getRepository(ProductoPromocion);
    const promos = await promoRepo.find({ where: { producto_id: In(items.map((p) => p.id)) } });

    const resultItems = items.map((p) => {
      const base: any = {
        id: p.id,
        codigo_sku: p.codigo_sku,
        nombre: p.nombre,
        descripcion: p.descripcion,
        categoria: p.categoria_id ? catMap.get(p.categoria_id) ?? null : null,
        peso_unitario_kg: parseFloat(String(p.peso_unitario_kg)),
        volumen_m3: p.volumen_m3 ? parseFloat(String(p.volumen_m3)) : null,
        requiere_frio: p.requiere_frio,
        unidad_medida: p.unidad_medida,
        imagen_url: p.imagen_url,
        activo: p.activo,
        precios: precioRows.filter((pr) => pr.producto_id === p.id).map((pr) => ({ lista_id: pr.lista_id, precio: Number(pr.precio) })),
        promociones: promos.filter((pr) => pr.producto_id === p.id).map((pr) => ({ campana_id: pr.campania_id, precio_oferta: pr.precio_oferta_fijo })).filter((pp: any) => pp.precio_oferta != null),
      };
      return base;
    });

    const total_pages = Math.ceil(total / per_page);
    return { metadata: { total_items: total, page, per_page, total_pages }, items: resultItems };
  }

  async findOne(id: string) {
    const p = await this.repo.findOne({ where: { id, deleted_at: null, activo: true } });
    if (!p) throw new NotFoundException('Product not found');
    return p;
  }

  create(dto: Partial<Product>) {
    const ent = this.repo.create(dto);
    return this.repo.save(ent);
  }

  async update(id: string, dto: Partial<Product>) {
    await this.repo.update(id, dto);
    return this.findOne(id);
  }

  async softDelete(id: string) {
    const now = new Date();
    await this.repo.update(id, { deleted_at: now, activo: false } as any);
    return { id, deleted_at: now };
  }
}
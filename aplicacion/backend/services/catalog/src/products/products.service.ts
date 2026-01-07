import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Not, IsNull } from 'typeorm';

import { PrecioItem } from '../precios/entities/precio.entity';
import { ProductoPromocion } from '../promociones/entities/producto-promocion.entity';
import { PromocionesService } from '../promociones/promociones.service';

import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto'; // Asegúrate de crear este archivo

export type FindOptions = {
  page?: number;
  per_page?: number;
  q?: string;
  roles?: string[];
  clienteListaId?: number | null;
  clienteId?: string | null;
};

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product) private readonly repo: Repository<Product>,
    @InjectRepository(PrecioItem) private readonly precioRepo: Repository<PrecioItem>,
    @InjectRepository(ProductoPromocion) private readonly promoRepo: Repository<ProductoPromocion>,
    private readonly promocionesService: PromocionesService,
  ) {}

  async findAll(opts: FindOptions = {}) {
    const { page = 1, per_page = 20 } = opts;
    
    // 1. Query Base Optimizada
    const qb = this.repo.createQueryBuilder('p')
      .leftJoinAndSelect('p.categoria', 'cat') // Join eficiente
      .where('p.activo = :activo', { activo: true });

    if (opts.q) {
      qb.andWhere('(p.nombre ILIKE :q OR p.codigoSku ILIKE :q)', { q: `%${opts.q}%` });
    }

    // 2. Paginación
    const [products, total] = await qb
      .skip((page - 1) * per_page)
      .take(per_page)
      .getManyAndCount();

    if (!products.length) {
      return this.buildResponse([], total, page, per_page);
    }

    // 3. Cargar Precios y Promociones en paralelo (Data Loading Pattern)
    const productIds = products.map(p => p.id);
    const [precios, promos] = await Promise.all([
      this.fetchPrices(productIds, opts),
      this.fetchPromos(productIds, opts),
    ]);

    // 4. Transformar resultado
    const items = products.map(p => this.transformProduct(p, precios, promos, opts.roles));

    return this.buildResponse(items, total, page, per_page);
  }

  async findByCategory(categoriaId: number, opts: FindOptions = {}) {
    const { page = 1, per_page = 20 } = opts;

    const qb = this.repo.createQueryBuilder('p')
      .leftJoinAndSelect('p.categoria', 'cat')
      .where('p.activo = :activo', { activo: true })
      .andWhere('p.categoria_id = :cid', { cid: categoriaId });

    if (opts.q) {
      qb.andWhere('(p.nombre ILIKE :q OR p.codigoSku ILIKE :q)', { q: `%${opts.q}%` });
    }

    const [products, total] = await qb.skip((page - 1) * per_page).take(per_page).getManyAndCount();

    if (!products.length) return this.buildResponse([], total, page, per_page);

    const productIds = products.map(p => p.id);
    const [precios, promos] = await Promise.all([
      this.fetchPrices(productIds, opts),
      this.fetchPromos(productIds, opts),
    ]);

    const items = products.map(p => this.transformProduct(p, precios, promos, opts.roles));
    return this.buildResponse(items, total, page, per_page);
  }

  async findOne(id: string, opts: FindOptions = {}) {
    const product = await this.repo.findOne({
      where: { id },
      relations: ['categoria'],
    });
    if (!product) throw new NotFoundException('Producto no encontrado');

    // Buscar precios y promociones para este producto
    const [precios, promos] = await Promise.all([
      this.fetchPrices([product.id], opts),
      this.fetchPromos([product.id], opts),
    ]);

    // Transformar y devolver el objeto final (incluye precios filtrados por lista si aplica)
    return this.transformProduct(product, precios, promos, opts.roles);
  }

  async create(dto: CreateProductDto) {
    const product = this.repo.create(dto);
    return this.repo.save(product);
  }

  async update(id: string, dto: Partial<CreateProductDto>) {
    const product = await this.repo.preload({ id, ...dto });
    if (!product) throw new NotFoundException('Producto no encontrado');
    return this.repo.save(product);
  }

  async softDelete(id: string) {
    const product = await this.findOne(id);
    product.activo = false;
    await this.repo.save(product); // Desactiva lógicamente
    await this.repo.softRemove(product); // Marca fecha deleted_at
    return { id, message: 'Producto eliminado' };
  }

  async restore(id: string) {
    await this.repo.restore(id);
    await this.repo.update(id, { activo: true });
    return this.findOne(id);
  }

  findDeleted() {
    return this.repo.find({ withDeleted: true, where: { deletedAt: Not(IsNull()) } });
  }

  // --- Helpers Privados ---

  private async fetchPrices(productIds: string[], opts: FindOptions) {
    const whereCondition: any = { producto_id: In(productIds) };
    
    // Si es cliente, solo trae precios de su lista
    if (opts.roles?.includes('cliente') && opts.clienteListaId) {
      whereCondition.lista_id = opts.clienteListaId;
    }
    
    return this.precioRepo.find({ where: whereCondition });
  }

  private async fetchPromos(productIds: string[], opts: FindOptions) {
    // Delegar la lógica de alcance/filtrado al servicio de promociones
    return this.promocionesService.findPromosForCliente(productIds, opts.clienteId ?? undefined, opts.clienteListaId ?? undefined);
  }

  private transformProduct(p: Product, allPrices: PrecioItem[], allPromos: ProductoPromocion[], roles: string[] = []) {
    // Campos base
    const base: any = {
      id: p.id,
      codigo_sku: p.codigoSku,
      nombre: p.nombre,
      imagen_url: p.imagenUrl,
      unidad_medida: p.unidadMedida,
      peso_unitario_kg: Number(p.pesoUnitarioKg),
    };

    const isBodeguero = roles.includes('bodeguero');
    
    // Campos extendidos (No bodeguero)
    if (!isBodeguero) {
      base.descripcion = p.descripcion;
      base.categoria = p.categoria ? { id: p.categoria.id, nombre: p.categoria.nombre } : null;
      base.requiere_frio = p.requiereFrio;
      base.volumen_m3 = p.volumenM3 ? Number(p.volumenM3) : null;
      base.activo = p.activo;

      // Mapear precios
      const preciosProducto = allPrices
        .filter(pr => pr.producto_id === p.id)
        .map(pr => ({ lista_id: pr.lista_id, precio: Number(pr.precio) }));
      base.precios = preciosProducto;

      // Precio base (usar el menor si hay más de uno, o null si no tiene precio)
      const precioOriginal = preciosProducto.length ? Math.min(...preciosProducto.map(x => x.precio)) : null;

      // Mapear promociones aplicables y calcular mejor oferta
      const promosProducto = allPromos.filter(pr => pr.producto_id === p.id);
      const promosMapped: any[] = [];
      let mejorOferta: { precio_oferta: number; campania_id: number; ahorro: number } | null = null;

      for (const pr of promosProducto) {
        const camp: any = (pr as any).campania || null;
        let precioOferta: number | null = null;

        if (precioOriginal == null) {
          // Si no hay precio base, no podemos calcular oferta
          precioOferta = null;
        } else if (pr.precio_oferta_fijo != null) {
          precioOferta = Number(pr.precio_oferta_fijo);
        } else if (camp) {
          const tipo = (camp.tipo_descuento || '').toString().toUpperCase();
          const valor = Number(camp.valor_descuento || 0);
          if (tipo === 'PORCENTAJE') {
            precioOferta = +(precioOriginal * (1 - valor / 100));
          } else if (tipo === 'MONTO_FIJO') {
            precioOferta = +(precioOriginal - valor);
          }
        }

        if (precioOferta != null) {
          if (precioOferta < 0) precioOferta = 0;
          // Redondeo a 2 decimales
          precioOferta = Math.round(precioOferta * 100) / 100;
        }

        const mapped = {
          campana_id: pr.campania_id,
          precio_oferta: precioOferta,
          tipo_descuento: (pr as any).campania?.tipo_descuento ?? null,
          valor_descuento: (pr as any).campania?.valor_descuento ?? null,
        };
        promosMapped.push(mapped);

        if (precioOferta != null && precioOriginal != null) {
          const ahorro = +(precioOriginal - precioOferta);
          if (!mejorOferta || precioOferta < mejorOferta.precio_oferta) {
            mejorOferta = { precio_oferta: precioOferta, campania_id: pr.campania_id, ahorro };
          }
        }
      }

      base.promociones = promosMapped;
      if (mejorOferta) {
        base.precio_original = precioOriginal;
        base.precio_oferta = mejorOferta.precio_oferta;
        base.ahorro = Math.round((mejorOferta.ahorro) * 100) / 100;
        base.campania_aplicada_id = mejorOferta.campania_id;
      } else if (precioOriginal != null) {
        base.precio_original = precioOriginal;
      }
    }

    return base;
  }

  private buildResponse(items: any[], total: number, page: number, per_page: number) {
    return {
      metadata: { total_items: total, page, per_page, total_pages: Math.ceil(total / per_page) },
      items,
    };
  }
}
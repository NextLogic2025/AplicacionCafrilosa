import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Not, IsNull } from 'typeorm';

import { PrecioItem } from '../precios/entities/precio.entity';
import { ProductoPromocion } from '../promociones/entities/producto-promocion.entity';

import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto'; // Asegúrate de crear este archivo

export type FindOptions = {
  page?: number;
  per_page?: number;
  q?: string;
  roles?: string[];
  clienteListaId?: number | null;
};

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product) private readonly repo: Repository<Product>,
    @InjectRepository(PrecioItem) private readonly precioRepo: Repository<PrecioItem>,
    @InjectRepository(ProductoPromocion) private readonly promoRepo: Repository<ProductoPromocion>,
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
      this.fetchPromos(productIds)
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
      this.fetchPromos(productIds),
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
      this.fetchPromos([product.id]),
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

  private async fetchPromos(productIds: string[]) {
    return this.promoRepo.find({ 
      where: { producto_id: In(productIds) },
      relations: ['campania'] // Traer datos de la campaña si es necesario
    });
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
      base.precios = allPrices
        .filter(pr => pr.producto_id === p.id)
        .map(pr => ({ lista_id: pr.lista_id, precio: Number(pr.precio) }));

      // Mapear promociones
      base.promociones = allPromos
        .filter(pr => pr.producto_id === p.id && pr.precio_oferta_fijo != null)
        .map(pr => ({ campana_id: pr.campania_id, precio_oferta: Number(pr.precio_oferta_fijo) }));
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
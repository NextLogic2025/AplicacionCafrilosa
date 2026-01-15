import { Injectable, NotFoundException, InternalServerErrorException, Logger, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';

import { Product } from '../products/entities/product.entity';
import { Category } from '../categories/entities/category.entity';
import { ProductoPromocion } from '../promociones/entities/producto-promocion.entity';
import { PromocionesService } from '../promociones/promociones.service';

import { PrecioItem } from './entities/precio.entity';
import { ListaPrecio } from './entities/lista-precio.entity';
import { CreatePrecioDto } from './dto/create-precio.dto';
import { CreateListaPrecioDto } from './dto/create-lista-precio.dto';

@Injectable()
export class PreciosService {
  private readonly logger = new Logger(PreciosService.name);

  constructor(
    @InjectRepository(PrecioItem)
    private readonly precioRepo: Repository<PrecioItem>,
    @InjectRepository(ListaPrecio)
    private readonly listaRepo: Repository<ListaPrecio>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(Category) // Inyectar directamente
    private readonly categoryRepo: Repository<Category>,
    @InjectRepository(ProductoPromocion) // Inyectar directamente
    private readonly promoRepo: Repository<ProductoPromocion>,
    @Inject(forwardRef(() => PromocionesService))
    private readonly promocionesService: PromocionesService,
  ) {}

  // --- GESTIÓN DE PRECIOS INDIVIDUALES ---

  async asignarPrecio(dto: CreatePrecioDto) {
    try {
      // TypeORM detecta la llave compuesta. Si existe, actualiza; si no, inserta.
      const precio = this.precioRepo.create({
        lista_id: dto.listaId,
        producto_id: dto.productoId,
        precio: dto.precio,
      });
      return await this.precioRepo.save(precio);
    } catch (err) {
      this.logger.error(`Error asignando precio: ${err.message}`, err.stack);
      throw new InternalServerErrorException('Error al asignar el precio');
    }
  }

  async removePrecio(listaId: number, productoId: string) {
    const result = await this.precioRepo.delete({ 
      lista_id: listaId, 
      producto_id: productoId 
    });
    
    if (result.affected === 0) throw new NotFoundException('Precio no encontrado');
    return { message: 'Precio eliminado correctamente' };
  }

  async obtenerPreciosDeProducto(productoId: string) {
    return this.precioRepo.find({
      where: { producto_id: productoId },
      relations: ['lista'],
      order: { lista_id: 'ASC' }
    });
  }

  // --- GESTIÓN DE LISTAS ---

  async findAllListas() {
    return this.listaRepo.find({ order: { id: 'ASC' } });
  }

  async createLista(dto: CreateListaPrecioDto) {
    const lista = this.listaRepo.create(dto);
    return this.listaRepo.save(lista);
  }

  async updateLista(id: number, dto: Partial<CreateListaPrecioDto>) {
    const lista = await this.listaRepo.preload({ id, ...dto });
    if (!lista) throw new NotFoundException('Lista de precios no encontrada');
    return this.listaRepo.save(lista);
  }

  async deleteLista(id: number) {
    const result = await this.listaRepo.delete(id);
    if (result.affected === 0) throw new NotFoundException('Lista no encontrada');
    return { message: 'Lista eliminada' };
  }

  // --- CONSULTAS COMPLEJAS (REPORTES Y VISTAS) ---

  /**
   * Obtiene productos paginados que tienen precio en una lista específica.
   * Carga categorías y promociones en paralelo para mayor velocidad.
   */
  async productosConPrecioParaLista(
    listaId: number,
    opts: { page?: number; per_page?: number; q?: string } = {},
  ) {
    const page = Number(opts.page) || 1;
    const limit = Number(opts.per_page) || 20;
    const offset = (page - 1) * limit;

    // 1. Query Base: Precios + Productos
    const qb = this.precioRepo.createQueryBuilder('pi')
      .innerJoinAndSelect('pi.producto', 'prod')
      .innerJoinAndSelect('pi.lista', 'lista')
      .where('pi.lista_id = :listaId', { listaId })
      .andWhere('prod.activo = TRUE'); // Solo productos activos

    if (opts.q) {
      qb.andWhere('(prod.nombre ILIKE :q OR prod.codigo_sku ILIKE :q)', { q: `%${opts.q}%` });
    }

    const [rows, total] = await qb
      .skip(offset)
      .take(limit)
      .getManyAndCount();

    if (rows.length === 0) {
      return this.buildResponse([], total, page, limit);
    }

    // 2. Data Loading Pattern (Cargar relaciones en paralelo)
    const productIds = rows.map(r => r.producto_id);
    const categoryIds = [...new Set(rows.map(r => r.producto.categoriaId).filter(Boolean))];

    const [categorias, promos] = await Promise.all([
      categoryIds.length ? this.categoryRepo.findBy({ id: In(categoryIds) }) : [] as Category[],
      // Usar PromocionesService para aplicar reglas de alcance y cargar campania
      this.promocionesService.findPromosForCliente(productIds, undefined, listaId) as Promise<ProductoPromocion[]>
    ]);

    // Mapas para acceso rápido O(1)
    const catMap = new Map<number, Category>(categorias.map(c => [c.id, c] as [number, Category]));
    // Agrupar promociones por producto
    const promoMap = new Map<string, ProductoPromocion[]>();
    (promos as ProductoPromocion[]).forEach(p => {
       const list = promoMap.get(p.producto_id) || [];
       list.push(p);
       promoMap.set(p.producto_id, list);
    });

    // 3. Transformación
    const items = rows.map(row => {
      const p = row.producto;
      const cat = p.categoriaId ? catMap.get(p.categoriaId) : null;
      const productoPromos = promoMap.get(p.id) || [];

      // calcular promociones aplicables usando el precio de lista como base
      const precioListaNum = Number(row.precio);
      const promocionesCalc = productoPromos.map(pr => {
        const camp: any = (pr as any).campania || null;
        let precioOferta: number | null = null;
        if (precioListaNum != null) {
          if (pr.precio_oferta_fijo != null) precioOferta = Number(pr.precio_oferta_fijo);
          else if (camp) {
            const tipo = (camp.tipo_descuento || '').toString().toUpperCase();
            const valor = Number(camp.valor_descuento || 0);
            if (tipo === 'PORCENTAJE') precioOferta = +(precioListaNum * (1 - valor / 100));
            else if (tipo === 'MONTO_FIJO') precioOferta = +(precioListaNum - valor);
          }
          if (precioOferta != null) {
            if (precioOferta < 0) precioOferta = 0;
            precioOferta = Math.round(precioOferta * 100) / 100;
          }
        }

        return {
          campana_id: pr.campania_id,
          campana_nombre: camp?.nombre ?? null,
          precio_oferta: precioOferta,
          tipo_descuento: camp?.tipo_descuento ?? null,
          valor_descuento: camp?.valor_descuento ?? null,
        };
      });

      return {
        id: p.id,
        codigo_sku: p.codigoSku,
        nombre: p.nombre,
        categoria: cat ? { id: cat.id, nombre: cat.nombre } : null,
        unidad_medida: p.unidadMedida,
        precio_lista: precioListaNum, // El precio viene de la tabla intermedia
        promociones: promocionesCalc.filter(pr => pr.precio_oferta != null),
      };
    });

    return this.buildResponse(items, total, page, limit);
  }

  private buildResponse(items: any[], total: number, page: number, limit: number) {
    return {
      metadata: {
        total_items: total,
        page,
        per_page: limit,
        total_pages: Math.ceil(total / limit)
      },
      items
    };
  }

  // Obtener precios de un producto filtrado por UNA lista específica
  // (Ideal para cuando un cliente consulta un producto)
  async obtenerPreciosDeProductoParaLista(productoId: string, listaId: number) {
    return this.precioRepo.find({
      where: {
        producto_id: productoId,
        lista_id: listaId,
      },
      relations: ['lista'],
      order: { lista_id: 'ASC' },
    });
  }
}
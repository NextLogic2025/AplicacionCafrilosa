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
  ) { }

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
        descripcion: p.descripcion,
        imagen_url: p.imagenUrl,
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

  /**
   * Calcula en bloque los precios finales para una lista dada.
   * items: [{ id: productoId, cantidad? }]
   */
  // En PreciosService
  // ... imports y constructor ...

  // --- REEMPLAZA TU MÉTODO calculateBatchForLista CON ESTE ---
  async calculateBatchForLista(items: Array<{ id: string; cantidad?: number }>, listaId: number) {
    // 1. Validar input
    const productIds = Array.from(new Set((items || []).map(i => i.id)));
    if (!productIds.length) return [];

    // 2. Obtener precios base desde BD (SQL Aggregation)
    // Busca precio en lista específica, si no existe, busca el mínimo global (fallback)
    const preciosRaw = await this.precioRepo.createQueryBuilder('pi')
      .select('pi.producto_id', 'producto_id')
      .addSelect(`
          COALESCE(
              MAX(CASE WHEN pi.lista_id = :listaId THEN pi.precio END), 
              MIN(pi.precio)
          )
      `, 'precio_base')
      .where('pi.producto_id IN (:...ids)', { ids: productIds })
      .groupBy('pi.producto_id')
      .setParameters({ listaId })
      .getRawMany();

    const preciosMap = new Map<string, number>();
    preciosRaw.forEach(row => {
      // Nota: getRawMany devuelve strings para numeros en algunos drivers de PG
      preciosMap.set(String(row.producto_id), Number(row.precio_base));
    });

    // 3. Cargar Promociones (Usando el método que YA EXISTE en tu PromocionesService)
    // Filtramos solo productos que tienen precio base para no buscar de más
    const validProductIds = productIds.filter(id => preciosMap.has(id));
    let promos: any[] = [];

    if (validProductIds.length > 0) {
      // CORRECCIÓN: Usamos findPromosForCliente que ya tenías definido
      promos = await this.promocionesService.findPromosForCliente(validProductIds, undefined, listaId) as any[];
    }

    // 4. Calcular precio final en memoria
    return items.map(item => {
      const precioBase = preciosMap.get(item.id);

      // Si no hay precio base, retornamos nulls
      if (precioBase === undefined || precioBase === null) {
        return {
          producto_id: item.id,
          precio_lista: null,
          precio_final: null,
          campania_id: null
        };
      }

      // Filtrar promos para este producto
      const misPromos = promos.filter(p => String(p.producto_id) === String(item.id));

      // CORRECCIÓN: Llamamos al helper privado implementado abajo
      const mejorOpcion = this.calcularMejorDescuento(precioBase, misPromos);

      return {
        producto_id: item.id,
        precio_lista: precioBase,
        precio_final: mejorOpcion.precio_final,
        campania_id: mejorOpcion.campania_id
      };
    });
  }

  // --- AGREGA ESTOS MÉTODOS PRIVADOS AL FINAL DE LA CLASE (ANTES DE LA ÚLTIMA }) ---

  /**
   * Helper para calcular el mejor precio posible dado un precio base y un array de promociones
   */
  private calcularMejorDescuento(precioBase: number, promos: any[]) {
    let mejorPrecio = precioBase;
    let mejorCampaniaId: number | null = null;

    for (const pr of promos) {
      const camp = pr.campania || null;
      if (!camp) continue;

      let precioOferta: number | null = null;
      const tipo = (camp.tipo_descuento || '').toString().toUpperCase();
      const valor = Number(camp.valor_descuento || 0);

      // Calcular descuento según tipo
      if (tipo === 'PORCENTAJE') {
        precioOferta = precioBase * (1 - valor / 100);
      } else if (tipo === 'MONTO_FIJO') {
        precioOferta = precioBase - valor;
      } else if (pr.precio_oferta_fijo != null) {
        // Caso especial: precio fijo directo en la tabla intermedia
        precioOferta = Number(pr.precio_oferta_fijo);
      }

      // Validar y comparar si es mejor oferta
      if (precioOferta !== null) {
        // Sanitizar (no negativos)
        if (precioOferta < 0) precioOferta = 0;

        // Redondear a 2 decimales
        precioOferta = Math.round(precioOferta * 100) / 100;

        // Nos quedamos con el precio más bajo
        if (precioOferta < mejorPrecio) {
          mejorPrecio = precioOferta;
          mejorCampaniaId = pr.campania_id;
        }
      }
    }

    return { precio_final: mejorPrecio, campania_id: mejorCampaniaId };
  }

} // <--- ASEGÚRATE DE QUE ESTA LLAVE CIERRE LA CLASE PreciosService
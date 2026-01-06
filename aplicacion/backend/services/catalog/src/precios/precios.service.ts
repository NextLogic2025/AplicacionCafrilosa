import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';

import { Product } from '../products/entities/product.entity';
import { Category } from '../categories/entities/category.entity';
import { ProductoPromocion } from '../promociones/entities/producto-promocion.entity';

import { PrecioItem } from './entities/precio.entity';
import { AsignarPrecioDto } from './dto/asignar-precio.dto';
import { ListaPrecio } from './entities/lista-precio.entity';

@Injectable()
export class PreciosService {
  constructor(
    @InjectRepository(PrecioItem)
    private precioRepo: Repository<PrecioItem>,
    @InjectRepository(ListaPrecio)
    private listaRepo: Repository<ListaPrecio>,
    @InjectRepository(Product)
    private productRepo: Repository<Product>,
  ) {}

  async asignarPrecio(dto: AsignarPrecioDto) {
    try {
      // Buscamos si ya existe precio para esa combinación usando QueryBuilder
      let precioEntidad = await this.precioRepo.findOne({
        where: { producto_id: dto.productoId, lista_id: dto.listaId },
        relations: ['producto', 'lista'],
      });

      if (precioEntidad) {
        // Si existe, actualizamos el precio
        precioEntidad.precio = dto.precio as any;
      } else {
        // Si no existe, creamos el registro nuevo asignando las PK compuestas directamente
        precioEntidad = this.precioRepo.create({
          producto_id: dto.productoId,
          lista_id: dto.listaId,
          precio: dto.precio as any,
        } as Partial<PrecioItem>);
      }

      return await this.precioRepo.save(precioEntidad);
    } catch (err) {
      console.error('Error en PreciosService.asignarPrecio:', err);
      throw new InternalServerErrorException('Error al asignar precio');
    }
  }

  // CRUD para listas de precios
  listAllListas() {
    return this.listaRepo.find();
  }

  async createLista(data: Partial<ListaPrecio>) {
    const ent = this.listaRepo.create(data as any);
    return this.listaRepo.save(ent);
  }

  async updateLista(id: number, data: Partial<ListaPrecio>) {
    await this.listaRepo.update(id, data as any);
    const l = await this.listaRepo.findOne({ where: { id } });
    if (!l) throw new NotFoundException('Lista no encontrada');
    return l;
  }

  async deleteLista(id: number) {
    return this.listaRepo.delete(id);
  }

  // Devuelve solo productos que tienen precio en la lista (INNER JOIN)
  async productosConPrecioParaLista(
    listaId: number,
    opts: { page?: number; per_page?: number; q?: string; role?: string[]; userId?: string; clienteListaId?: number | null } = {},
  ) {
    const page = opts.page && opts.page > 0 ? opts.page : 1;
    const per_page = opts.per_page && opts.per_page > 0 ? opts.per_page : 20;

    const qb = this.precioRepo
      .createQueryBuilder('pi')
      .innerJoinAndSelect('pi.producto', 'prod')
      .innerJoinAndSelect('pi.lista', 'l')
      .where('pi.lista_id = :lid', { lid: listaId })
      .andWhere('prod.deleted_at IS NULL')
      .andWhere('prod.activo = TRUE')
      ;

    if (opts.q) {
      qb.andWhere('(prod.nombre ILIKE :q OR prod.codigo_sku ILIKE :q)', { q: `%${opts.q}%` });
    }

    const rows = await qb.skip((page - 1) * per_page).take(per_page).getMany();

    // Build a count query separately to avoid TypeORM generating a COUNT with invalid aliases
    const countQb = this.precioRepo
      .createQueryBuilder('pi')
      .innerJoin('pi.producto', 'prod')
      .innerJoin('pi.lista', 'l')
      .where('pi.lista_id = :lid', { lid: listaId })
      .andWhere('prod.deleted_at IS NULL')
      .andWhere('prod.activo = TRUE');

    if (opts.q) {
      countQb.andWhere('(prod.nombre ILIKE :q OR prod.codigo_sku ILIKE :q)', { q: `%${opts.q}%` });
    }

    const total = await countQb.getCount();

    // load categories and promotions for the products
    const productIds = rows.map((r: any) => r.producto.id);
    const categoriaIds = Array.from(new Set(rows.map((r: any) => r.producto.categoria_id).filter(Boolean)));
    const categoryRepo = this.productRepo.manager.getRepository(Category);
    const categorias: any[] = categoriaIds.length ? await categoryRepo.findBy(categoriaIds.map((id: any) => ({ id } as any))) : [];
    const catMap = new Map(categorias.map((c: any) => [c.id, { id: c.id, nombre: c.nombre }]));

    const promoRepo = this.productRepo.manager.getRepository(ProductoPromocion);
    const promos = productIds.length ? await promoRepo.find({ where: { producto_id: In(productIds) } }) : [];

    const items = rows.map((r: any) => {
      const p = r.producto;
      return {
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
        precios: [{ lista_id: r.lista.id, precio: Number(r.precio) }],
        promociones: promos.filter((pr: any) => pr.producto_id === p.id).map((pr: any) => ({ campana_id: pr.campania_id, precio_oferta: pr.precio_oferta_fijo })).filter((pp: any) => pp.precio_oferta != null),
      };
    });

    const total_pages = Math.ceil(total / per_page);
    return { metadata: { total_items: total, page, per_page, total_pages }, items };
  }

  // Devuelve todos los productos y, cuando exista, su precio para la lista (LEFT JOIN)
  async todosProductosConPrecioParaLista(listaId: number) {
    return this.productRepo
      .createQueryBuilder('prod')
      .leftJoinAndMapOne(
        'prod.precio_asignado',
        PrecioItem,
        'pi',
        'pi.producto_id = prod.id AND pi.lista_id = :lid',
        { lid: listaId },
      )
      .where('prod.deleted_at IS NULL')
      .select(['prod', 'pi.precio'])
      .getMany();
  }

  // Método extra: Obtener todos los precios de un producto para mostrarlos en la pantalla de edición
  async obtenerPreciosDeProducto(productoId: string) {
    return this.precioRepo.find({
      where: { producto_id: productoId },
      relations: ['lista'],
    });
  }

  async obtenerPreciosDeProductoParaLista(productoId: string, listaId: number) {
    return this.precioRepo.find({
      where: { producto_id: productoId, lista_id: listaId },
      relations: ['lista'],
    });
  }

  async removePrecio(listaId: number, productoId: string) {
    const res = await this.precioRepo.delete({ lista_id: listaId, producto_id: productoId } as any);
    if (res.affected && res.affected > 0) return { deleted: true };
    throw new NotFoundException('Precio no encontrado');
  }
}
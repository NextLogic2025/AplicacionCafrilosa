import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Product } from '../products/entities/product.entity';

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
  async productosConPrecioParaLista(listaId: number) {
    return this.precioRepo
      .createQueryBuilder('p')
      .innerJoinAndSelect('p.producto', 'prod')
      .innerJoinAndSelect('p.lista', 'l')
      .where('p.lista_id = :lid', { lid: listaId })
      .select(['prod', 'p.precio', 'l.id', 'l.nombre'])
      .getMany();
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
}

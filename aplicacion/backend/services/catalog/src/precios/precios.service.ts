import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PrecioItem } from './entities/precio.entity';
import { AsignarPrecioDto } from './dto/asignar-precio.dto';

@Injectable()
export class PreciosService {
  constructor(
    @InjectRepository(PrecioItem)
    private precioRepo: Repository<PrecioItem>,
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

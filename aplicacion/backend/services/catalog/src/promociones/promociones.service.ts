import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';

import { CampaniaPromocional } from './entities/campania.entity';
import { ProductoPromocion } from './entities/producto-promocion.entity';
import { PromocionClientePermitido } from './entities/promocion-cliente-permitido.entity';

@Injectable()
export class PromocionesService {
  constructor(
    @InjectRepository(CampaniaPromocional)
    private campRepo: Repository<CampaniaPromocional>,
    @InjectRepository(ProductoPromocion)
    private prodPromoRepo: Repository<ProductoPromocion>,
    @InjectRepository(PromocionClientePermitido)
    private clientePromoRepo: Repository<PromocionClientePermitido>,
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
}

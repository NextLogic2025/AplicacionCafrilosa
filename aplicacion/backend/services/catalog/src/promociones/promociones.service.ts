import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

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
      relations: ['producto'],
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

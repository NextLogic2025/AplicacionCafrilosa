import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CampaniaPromocional } from './entities/campania.entity';
import { ProductoPromocion } from './entities/producto-promocion.entity';

@Injectable()
export class PromocionesService {
  constructor(
    @InjectRepository(CampaniaPromocional)
    private campRepo: Repository<CampaniaPromocional>,
    @InjectRepository(ProductoPromocion)
    private prodPromoRepo: Repository<ProductoPromocion>,
  ) {}

  // Campañas
  findCampanias() {
    return this.campRepo.find();
  }

  findCampania(id: number) {
    return this.campRepo.findOne({ where: { id } });
  }

  createCampania(data: Partial<CampaniaPromocional>) {
    const e = this.campRepo.create(data as any);
    return this.campRepo.save(e);
  }

  updateCampania(id: number, data: Partial<CampaniaPromocional>) {
    return this.campRepo.update(id, data as any).then(() => this.findCampania(id));
  }

  removeCampania(id: number) {
    return this.campRepo.delete(id);
  }

  // Productos en campaña
  addProductoPromo(data: Partial<ProductoPromocion>) {
    const e = this.prodPromoRepo.create(data as any);
    return this.prodPromoRepo.save(e);
  }

  findPromosByCampania(campaniaId: number) {
    return this.prodPromoRepo.find({ where: { campania_id: campaniaId }, relations: ['producto'] });
  }
}

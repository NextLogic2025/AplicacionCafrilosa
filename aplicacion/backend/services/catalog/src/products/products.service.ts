import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Product } from './entities/product.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly repo: Repository<Product>
  ) {}

  findAll() {
    return this.repo.find({ where: { deleted_at: null } });
  }

  async findOne(id: string) {
    const p = await this.repo.findOne({ where: { id, deleted_at: null } });
    if (!p) throw new NotFoundException('Product not found');
    return p;
  }

  create(dto: Partial<Product>) {
    const ent = this.repo.create(dto);
    return this.repo.save(ent);
  }

  async update(id: string, dto: Partial<Product>) {
    await this.repo.update(id, dto);
    return this.findOne(id);
  }

  async softDelete(id: string) {
    const now = new Date();
    await this.repo.update(id, { deleted_at: now, activo: false } as any);
    return { id, deleted_at: now };
  }
}

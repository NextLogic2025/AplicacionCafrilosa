import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, QueryDeepPartialEntity } from 'typeorm';

import { Category } from './entities/category.entity';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly repo: Repository<Category>
  ) {}

  findAll() {
    return this.repo.find({ where: { deleted_at: null } });
  }

  async findOne(id: string | number) {
    const nid = typeof id === 'string' ? Number(id) : id;
    const where: FindOptionsWhere<Category> = { id: nid as number, deleted_at: null };
    const e = await this.repo.findOne({ where });
    if (!e) throw new NotFoundException('Category not found');
    return e;
  }

  create(dto: Partial<Category>) {
    const ent = this.repo.create(dto);
    return this.repo.save(ent);
  }

  async update(id: string | number, dto: Partial<Category>) {
    const nid = typeof id === 'string' ? Number(id) : id;
    await this.repo.update(nid, dto as Partial<Category>);
    return this.findOne(nid);
  }

  async softDelete(id: string | number) {
    const nid = typeof id === 'string' ? Number(id) : id;
    const now = new Date();
    const update: QueryDeepPartialEntity<Category> = { deleted_at: now, activo: false };
    await this.repo.update(nid, update);
    return { id: nid, deleted_at: now };
  }
}

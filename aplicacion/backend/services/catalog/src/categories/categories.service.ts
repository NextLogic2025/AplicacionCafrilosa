import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull } from 'typeorm';

import { Category } from './entities/category.entity';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/create-category.dto';

@Injectable()
export class CategoriesService {
  private readonly logger = new Logger(CategoriesService.name);

  constructor(
    @InjectRepository(Category)
    private readonly repo: Repository<Category>
  ) {}

  findAll() {
    return this.repo.find({ 
      where: { deleted_at: IsNull(), activo: true },
      order: { id: 'ASC' }
    });
  }

  findDeleted() {
    return this.repo.find({ where: { deleted_at: Not(IsNull()) } });
  }

  async findOne(id: number) {
    const category = await this.repo.findOne({ where: { id, deleted_at: IsNull() } });
    if (!category) {
      this.logger.warn(`Categoría no encontrada ID: ${id}`);
      throw new NotFoundException(`Categoría #${id} no encontrada`);
    }
    return category;
  }

  async create(dto: CreateCategoryDto) {
    const ent = this.repo.create(dto);
    const saved = await this.repo.save(ent);
    this.logger.log(`Categoría creada: ${saved.nombre} (ID: ${saved.id})`);
    return saved;
  }

  async update(id: number, dto: UpdateCategoryDto) {
    const category = await this.findOne(id); // Reusa lógica de findOne para validar existencia
    const updated = await this.repo.save({ ...category, ...dto });
    this.logger.log(`Categoría actualizada ID: ${id}`);
    return updated;
  }

  async softDelete(id: number) {
    const category = await this.findOne(id);
    // Transacción implícita al salvar
    category.deleted_at = new Date();
    category.activo = false;
    
    await this.repo.save(category);
    this.logger.log(`Categoría eliminada (soft) ID: ${id}`);
    
    return { success: true, id, deleted_at: category.deleted_at };
  }

  async restore(id: number) {
    // Buscamos explícitamente incluso si está borrada
    const category = await this.repo.findOne({ where: { id } });
    if (!category) throw new NotFoundException('Categoría no encontrada');

    category.deleted_at = null;
    category.activo = true;
    
    await this.repo.save(category);
    this.logger.log(`Categoría restaurada ID: ${id}`);
    
    return category;
  }
}
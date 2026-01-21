import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager, IsNull } from 'typeorm';
import { AsignacionVendedores } from './entities/asignacion-vendedores.entity';
import { CreateAsignacionDto } from './dto/create-asignacion.dto';

@Injectable()
export class AsignacionService {
  private readonly logger = new Logger(AsignacionService.name);

  constructor(
    @InjectRepository(AsignacionVendedores)
    private readonly repo: Repository<AsignacionVendedores>,
    private readonly dataSource: DataSource, // Inyectamos para transacciones
  ) {}

  findAll() {
    // STANDARD: Filtrar siempre los borrados lógicamente
    return this.repo.find({ where: { deleted_at: IsNull() } });
  }

  /**
   * Crea una asignación asegurando que solo haya 1 principal por zona.
   * Usa transacciones para evitar condiciones de carrera.
   */
  async create(dto: CreateAsignacionDto) {
    return this.dataSource.transaction(async (manager: EntityManager) => {
      
      // 1. Validación de Negocio: Unicidad de Principal
      if (dto.es_principal) {
        const existePrincipal = await manager.findOne(AsignacionVendedores, {
          where: {
            zona_id: dto.zona_id,
            es_principal: true,
            deleted_at: IsNull() // Solo buscamos activos
          },
          lock: { mode: 'pessimistic_write' } // Bloqueamos para lectura segura
        });

        if (existePrincipal) {
          this.logger.warn(`Intento de duplicar principal en zona ${dto.zona_id}`);
          throw new BadRequestException('Ya existe un vendedor principal activo para esta zona.');
        }
      }

      // 2. Creación
      const nuevaAsignacion = manager.create(AsignacionVendedores, {
        ...dto,
        created_at: new Date(), // Forzamos fecha servidor
        updated_at: new Date()
      });

      return await manager.save(nuevaAsignacion);
    });
  }

  /**
   * Actualización segura
   */
  async update(id: number, dto: Partial<CreateAsignacionDto>) {
    return this.dataSource.transaction(async (manager) => {
        const asignacion = await manager.findOne(AsignacionVendedores, { where: { id } });
        if (!asignacion) throw new NotFoundException('Asignación no encontrada');

        // Si intenta volverse principal, verificamos que no choque con otro
        if (dto.es_principal === true && !asignacion.es_principal) {
             const zonaId = dto.zona_id || asignacion.zona_id;
             const existe = await manager.findOne(AsignacionVendedores, {
                 where: { zona_id: zonaId, es_principal: true, deleted_at: IsNull() }
             });
             
             if (existe && existe.id !== id) {
                 throw new BadRequestException('Ya hay un principal en esta zona');
             }
        }

        Object.assign(asignacion, dto);
        asignacion.updated_at = new Date();
        return await manager.save(asignacion);
    });
  }

  /**
   * STANDARD: Soft Delete (Borrado Lógico)
   * No borramos la fila, solo llenamos deleted_at
   */
  async remove(id: number) {
    const asignacion = await this.repo.findOne({ where: { id, deleted_at: IsNull() } });
    if (!asignacion) throw new NotFoundException('Asignación no encontrada o ya eliminada');

    asignacion.deleted_at = new Date();
    await this.repo.save(asignacion); // Update en lugar de Delete

    return { success: true, message: 'Asignación eliminada correctamente (soft delete)' };
  }
}
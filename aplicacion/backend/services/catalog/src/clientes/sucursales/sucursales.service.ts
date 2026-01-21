import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, IsNull } from 'typeorm';
import { SucursalCliente } from './entities/sucursal.entity';
import { CreateSucursalDto } from './dto/create-sucursal.dto';
import { UpdateSucursalDto } from './dto/update-sucursal.dto';
import { ZonaComercial } from '../../zonas/entities/zona.entity';

@Injectable()
export class SucursalesService {
  private readonly logger = new Logger(SucursalesService.name);

  constructor(
    @InjectRepository(SucursalCliente)
    private repo: Repository<SucursalCliente>,
    @InjectRepository(ZonaComercial)
    private zonaRepo: Repository<ZonaComercial>,
  ) { }

  async create(createDto: CreateSucursalDto) {
    // Validación de Zona
    if (createDto.zona_id) {
      const zona = await this.zonaRepo.findOne({
        where: { id: createDto.zona_id, deleted_at: IsNull() }
      });
      if (!zona) throw new NotFoundException(`Zona comercial ${createDto.zona_id} no encontrada`);
    }

    // Creación segura
    const entity = this.repo.create(createDto as any); // DTO mapea a entidad
    const savedResult = await this.repo.save(entity);

    // Asegurar que sea un objeto único, no un array
    const saved = Array.isArray(savedResult) ? savedResult[0] : savedResult;

    this.logger.log(`Sucursal creada: ${saved.id} para cliente ${saved.cliente_id}`);

    const enriched = await this.enrichWithZonaNames([saved]);
    return enriched[0];
  }

  async findAll(clienteId?: string) {
    const qb = this.repo.createQueryBuilder('s')
      .where('s.activo = :activo', { activo: true })
      .andWhere('s.deleted_at IS NULL');

    if (clienteId) {
      qb.andWhere('s.cliente_id = :clienteId', { clienteId });
    }

    const rows = await qb.getMany();
    return this.enrichWithZonaNames(rows);
  }

  async findDeactivated(clienteId?: string) {
    const qb = this.repo.createQueryBuilder('s')
      .where('s.activo = :activo', { activo: false })
      .andWhere('s.deleted_at IS NULL');

    if (clienteId) {
      qb.andWhere('s.cliente_id = :clienteId', { clienteId });
    }

    const rows = await qb.getMany();
    return this.enrichWithZonaNames(rows);
  }

  async findOne(id: string) {
    const row = await this.repo.findOne({ where: { id, deleted_at: IsNull() } });
    if (!row) return null; // El controlador decidirá si lanza 404

    const enriched = await this.enrichWithZonaNames([row]);
    return enriched[0];
  }

  async update(id: string, updateDto: UpdateSucursalDto) {
    // Validar Zona si se está actualizando
    if (updateDto.zona_id) {
      const zona = await this.zonaRepo.findOne({ where: { id: updateDto.zona_id, deleted_at: IsNull() } });
      if (!zona) throw new NotFoundException('Zona no encontrada');
    }

    const sucursal = await this.repo.findOne({ where: { id } });
    if (!sucursal) throw new NotFoundException('Sucursal no encontrada');

    // Merge seguro
    this.repo.merge(sucursal, updateDto as any);
    sucursal.updated_at = new Date();

    await this.repo.save(sucursal);
    this.logger.log(`Sucursal actualizada: ${id}`);

    return this.findOne(id);
  }

  async remove(id: string) {
    await this.repo.update(id, {
      activo: false,
      deleted_at: new Date(),
      updated_at: new Date()
    });
    this.logger.log(`Sucursal eliminada (soft): ${id}`);
    return { id, deleted: true };
  }

  async activate(id: string) {
    await this.repo.update(id, {
      activo: true,
      updated_at: new Date()
    });
    this.logger.log(`Sucursal reactivada: ${id}`);
    return this.findOne(id);
  }

  private async enrichWithZonaNames(sucursales: SucursalCliente[]) {
    if (!sucursales.length) return [];

    const zonaIds = [...new Set(sucursales.map(s => s.zona_id).filter(Boolean))];

    if (!zonaIds.length) {
      return sucursales.map(s => ({ ...s, zona_nombre: null }));
    }

    const zonas = await this.zonaRepo.find({ where: { id: In(zonaIds) } });
    const zonaMap = new Map(zonas.map(z => [z.id, z.nombre]));

    return sucursales.map(s => ({
      ...s,
      zona_nombre: s.zona_id ? (zonaMap.get(s.zona_id) ?? null) : null
    }));
  }
}

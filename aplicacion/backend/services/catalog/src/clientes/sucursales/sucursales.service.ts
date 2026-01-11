import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { SucursalCliente } from './entities/sucursal.entity';
import { CreateSucursalDto } from './dto/create-sucursal.dto';
import { UpdateSucursalDto } from './dto/update-sucursal.dto';
import { ZonaComercial } from '../../zonas/entities/zona.entity';

@Injectable()
export class SucursalesService {
  constructor(
    @InjectRepository(SucursalCliente)
    private repo: Repository<SucursalCliente>,
    @InjectRepository(ZonaComercial)
    private zonaRepo: Repository<ZonaComercial>,
  ) {}

  create(createDto: CreateSucursalDto) {
    return this.createAndValidate(createDto as any);
  }

  private async createAndValidate(data: any) {
    if (data.zona_id) {
      const zona = await this.zonaRepo.findOne({ where: { id: data.zona_id, deleted_at: null } });
      if (!zona) throw new NotFoundException('Zona no encontrada');
    }
    const entity = this.repo.create(data as any);
    const saved = await this.repo.save(entity);
    const enriched = await this.enrichWithZonaNames([saved]);
    return enriched[0];
  }

  findAll(clienteId?: string) {
    const qb = this.repo.createQueryBuilder('s').where('s.activo = true').andWhere('s.deleted_at IS NULL');
    if (clienteId) qb.andWhere('s.cliente_id = :clienteId', { clienteId });
    return qb.getMany().then(rows => this.enrichWithZonaNames(rows));
  }

  findDeactivated(clienteId?: string) {
    const qb = this.repo.createQueryBuilder('s').where('s.activo = false').andWhere('s.deleted_at IS NULL');
    if (clienteId) qb.andWhere('s.cliente_id = :clienteId', { clienteId });
    return qb.getMany().then(rows => this.enrichWithZonaNames(rows));
  }

  findOne(id: string) {
    return this.repo.findOne({ where: { id, deleted_at: null } }).then(async row => {
      if (!row) return null;
      const enriched = await this.enrichWithZonaNames([row]);
      return enriched[0];
    });
  }

  async update(id: string, updateDto: UpdateSucursalDto) {
    if ((updateDto as any).zona_id) {
      const zona = await this.zonaRepo.findOne({ where: { id: (updateDto as any).zona_id, deleted_at: null } });
      if (!zona) throw new NotFoundException('Zona no encontrada');
    }
    await this.repo.update(id, { ...updateDto, updated_at: new Date() } as any);
    return this.findOne(id);
  }

  async remove(id: string) {
    await this.repo.update(id, { activo: false, deleted_at: new Date(), updated_at: new Date() } as any);
    return { id, deleted: true };
  }

  async activate(id: string) {
    await this.repo.update(id, { activo: true, updated_at: new Date() } as any);
    return this.findOne(id);
  }

  private async enrichWithZonaNames(sucursales: SucursalCliente[] | any[]) {
    if (!sucursales || sucursales.length === 0) return sucursales;
    const zonaIds = [...new Set(sucursales.map(s => s.zona_id).filter(Boolean))];
    if (!zonaIds.length) return sucursales.map(s => ({ ...s, zona_nombre: null }));
    const zonas = await this.zonaRepo.find({ where: { id: In(zonaIds), deleted_at: null } as any });
    const zonaMap = new Map(zonas.map(z => [z.id, z.nombre]));
    return sucursales.map(s => ({ ...s, zona_nombre: s.zona_id ? (zonaMap.get(s.zona_id) ?? null) : null }));
  }
}

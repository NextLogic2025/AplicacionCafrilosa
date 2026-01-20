import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Despacho } from './entities/despacho.entity';
import { CreateDespachoDto } from './dto/create-despacho.dto';
import { ServiceHttpClient } from '../common/http/service-http-client.service';

@Injectable()
export class DespachosService {
  private readonly logger = new Logger(DespachosService.name);

  constructor(
    @InjectRepository(Despacho) private repo: Repository<Despacho>,
    private readonly serviceHttp: ServiceHttpClient,
  ) {}

  async findAll() {
    return this.repo.find({ where: { deleted_at: null } });
  }

  async findOne(id: string) {
    return this.repo.findOne({ where: { id, deleted_at: null } });
  }

  async create(dto: CreateDespachoDto) {
    const e = this.repo.create(dto as any);
    const savedResult = await this.repo.save(e);
    const saved = Array.isArray(savedResult) ? savedResult[0] : savedResult;
    this.logger.log(`Despacho creado: ${saved.id}`);
    // Ejemplo: obtener detalles de un pedido relacionado usando ServiceHttpClient
    // const order = await this.serviceHttp.get('orders-service', `/api/pedidos/${somePedidoId}`);
    return saved;
  }

  // Ejemplo de método que consulta a otro microservicio (orders)
  async fetchOrderSnapshot(pedidoId: string) {
    return this.serviceHttp.get('orders-service', `/api/pedidos/${pedidoId}`);
  }

  async update(id: string, dto: Partial<CreateDespachoDto>) {
    const row = await this.findOne(id);
    if (!row) throw new NotFoundException('Despacho no encontrado');
    Object.assign(row as any, dto);
    row.updated_at = new Date();
    return this.repo.save(row as any);
  }

  async remove(id: string) {
    await this.repo.update(id, { deleted_at: new Date() } as any);
    return { id, deleted: true };
  }
}

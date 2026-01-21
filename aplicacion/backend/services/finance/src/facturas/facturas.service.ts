import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Factura } from '../entities/factura.entity';

@Injectable()
export class FacturasService {
  constructor(
    @InjectRepository(Factura)
    private readonly facturaRepo: Repository<Factura>,
  ) {}

  async findAll(clienteId?: string) {
    if (clienteId) {
      return this.facturaRepo.find({ where: { clienteId } });
    }
    return this.facturaRepo.find();
  }

  async findOne(id: string) {
    return this.facturaRepo.findOne({ where: { id } });
  }

  async create(data: any) {
    const factura = this.facturaRepo.create(data);
    return this.facturaRepo.save(factura);
  }

  async findByPedidoId(pedidoId: string) {
    return this.facturaRepo.findOne({ where: { pedidoId } });
  }
}

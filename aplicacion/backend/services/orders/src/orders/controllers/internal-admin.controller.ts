import { Controller, Post, Logger, Req, BadRequestException, UseGuards } from '@nestjs/common';
import { ServiceAuthGuard } from '../../auth/guards/service-auth.guard';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CarritoCabecera } from '../entities/carrito-cabecera.entity';
import { ServiceHttpClient } from '../../common/http/service-http-client.service';

@Controller('internal/admin')
export class InternalAdminController {
  private readonly logger = new Logger(InternalAdminController.name);

  constructor(
    @InjectRepository(CarritoCabecera) private readonly cartRepo: Repository<CarritoCabecera>,
    private readonly serviceHttp: ServiceHttpClient,
  ) {}

  @Post('backfill-clients')
  @UseGuards(ServiceAuthGuard)
  async backfillClientes(@Req() req: any) {

    const carts = await this.cartRepo.find({ where: { cliente_id: null } });
    this.logger.debug(`Found ${carts.length} carts without cliente_id. Starting backfill.`);

    for (const c of carts) {
      try {
        const body = await this.serviceHttp.get<any>(
          'catalog-service',
          `/internal/clients/by-user/${c.usuario_id}`,
        );
        if (body && body.id) {
          c.cliente_id = body.id;
          await this.cartRepo.save(c);
          this.logger.debug(`Updated cart ${c.id} usuario=${c.usuario_id} cliente_id=${body.id}`);
        }
      } catch (err) {
        this.logger.warn('Error resolving client for cart', { cartId: c.id, err: err?.message || String(err) });
      }
    }

    return { message: 'Backfill finished' };
  }
}

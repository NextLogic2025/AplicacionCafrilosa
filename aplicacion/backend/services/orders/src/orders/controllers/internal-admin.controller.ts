import { Controller, Post, Logger, Req, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CarritoCabecera } from '../entities/carrito-cabecera.entity';
import { ConfigService } from '@nestjs/config';

@Controller('internal/admin')
export class InternalAdminController {
  private readonly logger = new Logger(InternalAdminController.name);

  constructor(
    @InjectRepository(CarritoCabecera) private readonly cartRepo: Repository<CarritoCabecera>,
    private readonly configService: ConfigService,
  ) {}

  @Post('backfill-clients')
  async backfillClientes(@Req() req: any) {
    // Seguridad S2S: validar SERVICE_TOKEN
    const serviceToken = this.configService.get<string>('SERVICE_TOKEN') || process.env.SERVICE_TOKEN;
    const auth = (req.headers?.authorization || '').toString();
    if (serviceToken && auth !== ('Bearer ' + serviceToken)) {
      throw new BadRequestException('Unauthorized internal access');
    }

    const carts = await this.cartRepo.find({ where: { cliente_id: null } });
    this.logger.debug(`Found ${carts.length} carts without cliente_id. Starting backfill.`);

    const base = this.configService.get<string>('CATALOG_SERVICE_URL') || process.env.CATALOG_SERVICE_URL || 'http://catalog-service:3000';
    const fetchFn = (globalThis as any).fetch;

    for (const c of carts) {
      try {
        if (typeof fetchFn !== 'function') continue;
        const apiBase = base.replace(/\/+$/, '') + (base.includes('/api') ? '' : '/api');
        const url = apiBase + '/internal/clients/by-user/' + c.usuario_id;
        const resp: any = await fetchFn(url);
        if (resp && resp.ok) {
          const body = await resp.json();
          if (body && body.id) {
            c.cliente_id = body.id;
            await this.cartRepo.save(c);
            this.logger.debug(`Updated cart ${c.id} usuario=${c.usuario_id} cliente_id=${body.id}`);
          }
        }
      } catch (err) {
        this.logger.warn('Error resolving client for cart', { cartId: c.id, err: err?.message || String(err) });
      }
    }

    return { message: 'Backfill finished' };
  }
}

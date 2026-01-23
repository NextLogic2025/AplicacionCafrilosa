// precios/precios.internal.controller.ts
import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ServiceAuthGuard } from '../auth/guards/service-auth.guard';
import { PreciosService } from './precios.service';

// DTOs reused from controller; validate minimally in service
@Controller('precios/internal')
@UseGuards(ServiceAuthGuard)
export class PreciosInternalController {
  constructor(private readonly preciosService: PreciosService) {}

  @Post('batch-calculator')
  async batchCalculate(@Body() dto: any) {
    let listaId = 1;
    if (dto?.cliente_id) {
      try {
        // resolve cliente handled in service previously; keep same behaviour
        // caller should send cliente_id when available
      } catch (e) {}
    }
    return this.preciosService.calculateBatchForLista(dto.items || [], dto.cliente_id ? undefined : listaId);
  }
}

import { Controller, Post, Body, Req, Logger, BadRequestException, UseGuards } from '@nestjs/common';
import { ServiceAuthGuard } from '../auth/guards/service-auth.guard';
import { ProductsService } from './products.service';
import { ClientesService } from '../clientes/clientes.service';

@Controller('products/internal')
export class ProductsInternalController {
  private readonly logger = new Logger(ProductsInternalController.name);

  constructor(private productsService: ProductsService, private clientesService: ClientesService) {}

  @Post('batch')
  @UseGuards(ServiceAuthGuard)
  async batch(@Body() body: { ids: string[]; cliente_id?: string }, @Req() req: any) {
    const ids = Array.isArray(body?.ids) ? body.ids.filter(Boolean) : [];
    if (!ids.length) throw new BadRequestException('ids is required');

    // Validar que los ids sean UUIDs para evitar errores de casting en la consulta
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const invalid = ids.filter(id => !uuidRegex.test(id));
    if (invalid.length) {
      throw new BadRequestException(`Invalid UUIDs provided: ${invalid.join(', ')}`);
    }
    // ahora protegido por ServiceAuthGuard

    let clienteListaId: number | null = null;
    if (body.cliente_id) {
      const cliente = await this.clientesService.findOne(String(body.cliente_id));
      clienteListaId = cliente?.lista_precios_id ?? null;
    }

    // Cargar cada producto con contexto de cliente paralelamente
    const proms = ids.map(id => this.productsService.findOne(id, { roles: ['cliente'], clienteListaId, clienteId: body.cliente_id ?? undefined }));
    const results = await Promise.all(proms);

    // Mapear a salida reducida (incluye precios y mejor promo ya calculada por transformProduct)
    return results.map((r: any) => ({
      id: r.id,
      codigo_sku: r.codigo_sku,
      nombre: r.nombre,
      unidad_medida: r.unidad_medida,
      precios: r.precios ?? [],
      promocion: r.precio_oferta != null ? { campania_id: r.campania_aplicada_id ?? null, campania_nombre: r.campania_aplicada_nombre ?? null, precio_final: r.precio_oferta, precio_lista: r.precio_original ?? null } : null,
    }));
  }
}

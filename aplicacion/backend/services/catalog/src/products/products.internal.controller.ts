import { Controller, Post, Body, Req, Logger, BadRequestException } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ClientesService } from '../clientes/clientes.service';

@Controller('products/internal')
export class ProductsInternalController {
  private readonly logger = new Logger(ProductsInternalController.name);

  constructor(private productsService: ProductsService, private clientesService: ClientesService) {}

  @Post('batch')
  async batch(@Body() body: { ids: string[]; cliente_id?: string }, @Req() req: any) {
    const ids = Array.isArray(body?.ids) ? body.ids.filter(Boolean) : [];
    if (!ids.length) throw new BadRequestException('ids is required');

    // Seguridad S2S: acepta SERVICE_TOKEN header Bearer
    const serviceToken = process.env.SERVICE_TOKEN;
    const auth = (req.headers?.authorization || '').toString();
    if (serviceToken) {
      const expected = `Bearer ${serviceToken}`;
      if (auth !== expected) {
        // If token not provided, still allow if caller is authenticated via JWT (e.g., admin)
        // But since this internal endpoint is intended for S2S, reject otherwise
        throw new BadRequestException('Unauthorized internal access');
      }
    }

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
      promocion: r.precio_oferta != null ? { campania_id: r.campania_aplicada_id ?? null, precio_final: r.precio_oferta, precio_lista: r.precio_original ?? null } : null,
    }));
  }
}

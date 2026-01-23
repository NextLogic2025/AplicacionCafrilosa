import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Req, Query, Logger, BadRequestException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { RolesGuard } from '../auth/guards/roles.guard';
import { ServiceAuthGuard } from '../auth/guards/service-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';

import { PromocionesService } from './promociones.service';
import { PreciosService } from '../precios/precios.service';
import { ClientesService } from '../clientes/clientes.service';
import { CreateCampaniaDto } from './dto/create-campania.dto';
import { UpdateCampaniaDto } from './dto/update-campania.dto';
import { AsignProductoPromoDto } from './dto/asign-producto-promo.dto';
import { AsignClientePromoDto } from './dto/asign-cliente-promo.dto';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('promociones')
export class PromocionesController {
  private readonly logger = new Logger(PromocionesController.name);

  constructor(
    private svc: PromocionesService,
    private preciosService: PreciosService,
    private clientesService: ClientesService,
  ) {}

  // ===== CAMPAÑAS =====
  @Get()
  @Roles('admin', 'supervisor', 'vendedor')
  listCampanias() {
    return this.svc.findCampanias();
  }

  @Get(':id')
  @Roles('admin', 'supervisor', 'vendedor')
  getCampania(@Param('id') id: string) {
    return this.svc.findCampania(Number(id));
  }

  @Post()
  @Roles('admin', 'supervisor')
  create(@Body() body: CreateCampaniaDto) {
    return this.svc.createCampania(body as any);
  }

  @Put(':id')
  @Roles('admin', 'supervisor')
  update(@Param('id') id: string, @Body() body: UpdateCampaniaDto) {
    return this.svc.updateCampania(Number(id), body as any);
  }

  @Delete(':id')
  @Roles('admin', 'supervisor')
  remove(@Param('id') id: string) {
    return this.svc.removeCampania(Number(id));
  }

  // ===== PRODUCTOS EN CAMPAÑA =====
  @Post(':id/productos')
  @Roles('admin', 'supervisor')
  addProducto(@Param('id') id: string, @Body() body: AsignProductoPromoDto) {
    return this.svc.addProductoPromo({ campania_id: Number(id), ...body } as any);
  }

  @Get(':id/productos')
  @Roles('admin', 'supervisor', 'vendedor')
  async getProductos(@Param('id') id: string) {
    const campaniaId = Number(id);
    const promos = await this.svc.findPromosByCampania(campaniaId);

    if (!promos || promos.length === 0) return [];

    // Cargar precios de todos los productos en paralelo
    const productIds = promos.map(p => p.producto_id);
    const preciosList = await Promise.all(productIds.map(pid => this.preciosService.obtenerPreciosDeProducto(pid)));

    // Mapear por producto
    const preciosMap = new Map<string, any[]>();
    productIds.forEach((pid, idx) => {
      preciosMap.set(pid, (preciosList[idx] || []).map(pr => ({ lista_id: pr.lista_id, precio: Number(pr.precio) })));
    });

    // Transformar cada promoción en el formato deseado
    const items = promos.map(pr => {
      const prod = pr.producto as any;
      const preciosProducto = preciosMap.get(pr.producto_id) || [];
      const precioOriginal = preciosProducto.length ? Math.min(...preciosProducto.map((x: any) => x.precio)) : null;

      // Calcular precio de oferta
      let precioOferta: number | null = null;
      const camp: any = (pr as any).campania || null;
      if (precioOriginal != null) {
        if (pr.precio_oferta_fijo != null) precioOferta = Number(pr.precio_oferta_fijo);
        else if (camp) {
          const tipo = (camp.tipo_descuento || '').toString().toUpperCase();
          const valor = Number(camp.valor_descuento || 0);
          if (tipo === 'PORCENTAJE') precioOferta = +(precioOriginal * (1 - valor / 100));
          else if (tipo === 'MONTO_FIJO') precioOferta = +(precioOriginal - valor);
        }
        if (precioOferta != null) {
          if (precioOferta < 0) precioOferta = 0;
          precioOferta = Math.round(precioOferta * 100) / 100;
        }
      }

      const promociones = [{ campana_id: pr.campania_id, precio_oferta: pr.precio_oferta_fijo != null ? Number(pr.precio_oferta_fijo) : precioOferta, tipo_descuento: camp?.tipo_descuento ?? null, valor_descuento: camp?.valor_descuento ?? null }];

      const item: any = {
        id: prod.id,
        codigo_sku: prod.codigoSku,
        nombre: prod.nombre,
        imagen_url: prod.imagenUrl ?? null,
        unidad_medida: prod.unidadMedida,
        peso_unitario_kg: prod.pesoUnitarioKg != null ? Number(prod.pesoUnitarioKg) : null,
        descripcion: prod.descripcion,
        categoria: prod.categoria ? { id: prod.categoria.id, nombre: prod.categoria.nombre } : null,
        requiere_frio: prod.requiereFrio,
        volumen_m3: prod.volumenM3 != null ? Number(prod.volumenM3) : null,
        activo: prod.activo,
        precios: preciosProducto,
        promociones,
      };

      if (precioOriginal != null) item.precio_original = precioOriginal;
      if (precioOferta != null) {
        item.precio_oferta = precioOferta;
        item.ahorro = Math.round((precioOriginal - precioOferta) * 100) / 100;
        item.campania_aplicada_id = pr.campania_id;
      }
      return item;
      });

    return { items };
  }

  @Get('mejor/producto/:id')
  @Roles('admin', 'supervisor', 'vendedor', 'cliente')
  async getBestPromotion(@Param('id') id: string, @Req() req: any, @Query('cliente_id') queryClienteId?: string) {
    const { roles, clienteListaId, clienteId } = await this.resolveClientContext(req, queryClienteId);
    try {
      const best = await this.svc.getBestPromotionForProduct(id, { clienteId, listaId: clienteListaId });
      return best || {};
    } catch (err) {
      this.logger.warn({ msg: 'Error obteniendo mejor promo', err: err.message });
      return {};
    }
  }

  @Delete(':id/productos/:productoId')
  @Roles('admin', 'supervisor')
  removeProducto(@Param('id') id: string, @Param('productoId') productoId: string) {
    return this.svc.removeProductoPromo(Number(id), productoId);
  }

  // Helper para resolver contexto cliente similar a products.controller
  private async resolveClientContext(req: any, queryClienteId?: string) {
    const roles = Array.isArray(req.user?.role)
      ? req.user.role.map((r: any) => String(r).toLowerCase())
      : [String(req.user?.role || '').toLowerCase()];

    let clienteListaId: number | null = null;
    let clienteId: string | undefined = undefined;

    if (roles.includes('cliente')) {
      clienteListaId = req.user['lista_precios_id'] ?? null;
      clienteId = req.user?.userId ?? undefined;

      if (!clienteListaId && req.user?.userId) {
        const cliente = await this.clientesService.findByUsuarioPrincipalId(req.user.userId);
        if (cliente) {
          clienteListaId = (cliente as any).lista_precios_id ?? null;
          clienteId = (cliente as any).id ?? clienteId;
        }
      }
    } else {
      const qClienteId = queryClienteId || req.query?.cliente_id || req.query?.clienteId;
      if (qClienteId && roles.some((r) => ['admin', 'supervisor', 'vendedor'].includes(r))) {
        const cliente = await this.clientesService.findOne(String(qClienteId));
        if (cliente) {
          clienteListaId = (cliente as any).lista_precios_id ?? null;
          clienteId = (cliente as any).id ?? undefined;
          if (!roles.includes('cliente')) roles.push('cliente');
        }
      }
    }

    return { roles, clienteListaId, clienteId };
  }

  // Internal S2S endpoint for best promo (used by other services)
  // Note: internal endpoints moved to separate controller guarded by ServiceAuthGuard

  // ===== CLIENTES PERMITIDOS (para alcance POR_CLIENTE) =====
  @Post(':id/clientes')
  @Roles('admin', 'supervisor')
  addCliente(@Param('id') id: string, @Body() body: AsignClientePromoDto) {
    return this.svc.addClientePermitido(Number(id), body.cliente_id);
  }

  @Get(':id/clientes')
  @Roles('admin', 'supervisor')
  getClientes(@Param('id') id: string) {
    return this.svc.findClientesPermitidos(Number(id));
  }

  @Delete(':id/clientes/:clienteId')
  @Roles('admin', 'supervisor')
  removeCliente(@Param('id') id: string, @Param('clienteId') clienteId: string) {
    return this.svc.removeClientePermitido(Number(id), clienteId);
  }
}


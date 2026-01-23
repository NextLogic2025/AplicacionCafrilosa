import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, DataSource } from 'typeorm';
import { Factura } from '../entities/factura.entity';
import { CatalogExternalService } from '../common/external/catalog.external.service';
import { CuentaPorCobrar } from '../entities/cuenta-por-cobrar.entity';
import { WarehouseExternalService } from '../common/external/warehouse.external.service';
import { OrdersExternalService } from '../common/external/orders.external.service';
import { UsuariosExternalService } from '../common/external/usuarios.external.service';

type EnrichedFactura = Factura & {
  items_count?: number;
  detalles: any[];
  saldo_pendiente?: number;
  fecha_vencimiento?: Date | null;
  codigo_pedido?: string | null;
  vendedor_nombre?: string | null;
};

@Injectable()
export class FacturasService {
  private readonly logger = new Logger(FacturasService.name);
  constructor(
    @InjectRepository(Factura)
    private readonly facturaRepo: Repository<Factura>,
    @InjectRepository(CuentaPorCobrar)
    private readonly cxcRepo: Repository<CuentaPorCobrar>,
    private readonly dataSource: DataSource,
    private readonly catalogExternal: CatalogExternalService,
    private readonly warehouseExternal: WarehouseExternalService,
    private readonly ordersExternal: OrdersExternalService,
    private readonly usuariosExternal: UsuariosExternalService,
  ) {}

  /* ---- Stored-procedure backed operations (use DB SPs as ACID unit) ---- */

  async spCreateFacturaBorrador(pClienteId: string, pMeta: any = {}): Promise<string | null> {
    const res = await this.dataSource.query('SELECT sp_factura_crear_borrador($1::uuid, $2::json) as id', [pClienteId, JSON.stringify(pMeta || {})]);
    return res?.[0]?.id || null;
  }

  async spAgregarDetalleBatch(pFacturaId: string, detalles: any[]): Promise<void> {
    // detalles: [{producto_id, cantidad, precio_unitario, descuento}] as JSON
    await this.dataSource.query('SELECT sp_factura_agregar_detalle_batch($1::uuid, $2::json)', [pFacturaId, JSON.stringify(detalles || [])]);
  }

  async spEmitirFactura(pFacturaId: string, pFechaVencimiento: string | null, pCuotas = 1): Promise<void> {
    await this.dataSource.query('SELECT sp_factura_emitir($1::uuid, $2::date, $3::int)', [pFacturaId, pFechaVencimiento, pCuotas]);
  }

  async spAnularFactura(pFacturaId: string, pMotivo: string): Promise<void> {
    await this.dataSource.query('SELECT sp_factura_anular($1::uuid, $2::text)', [pFacturaId, pMotivo]);
  }

  /* Recibos */
  async spReciboCrear(pClienteId: string, pVendedorId: string | null, pTotal: number, pMeta: any = {}): Promise<string | null> {
    const res = await this.dataSource.query('SELECT sp_recibo_crear($1::uuid, $2::uuid, $3::numeric, $4::json) as id', [pClienteId, pVendedorId, pTotal, JSON.stringify(pMeta || {})]);
    return res?.[0]?.id || null;
  }

  async spReciboAgregarPago(pReciboId: string, pago: { metodo: string; monto: number; referencia?: string }): Promise<void> {
    await this.dataSource.query('SELECT sp_recibo_agregar_pago($1::uuid, $2::text, $3::numeric, $4::text)', [pReciboId, pago.metodo, pago.monto, pago.referencia || null]);
  }

  async spReciboConfirmar(pReciboId: string): Promise<void> {
    await this.dataSource.query('SELECT sp_recibo_confirmar($1::uuid)', [pReciboId]);
  }

  async spReciboAplicarFifo(pReciboId: string): Promise<any> {
    const res = await this.dataSource.query('SELECT sp_recibo_aplicar_fifo($1::uuid) as result', [pReciboId]);
    return res?.[0]?.result || null;
  }

  async spReciboAnular(pReciboId: string, pMotivo: string): Promise<void> {
    await this.dataSource.query('SELECT sp_recibo_anular($1::uuid, $2::text)', [pReciboId, pMotivo]);
  }

  async findAll(clienteId?: string) {
    const qb = this.facturaRepo.createQueryBuilder('f').leftJoinAndSelect('f.detalles', 'd').orderBy('f.created_at', 'DESC');
    if (clienteId) {
      const client = await this.catalogExternal.getClientByUser(clienteId);
      if (client?.id) qb.andWhere('f.clienteId = :clienteId', { clienteId: client.id });
    }

    const facturas = await qb.getMany();
    return this._enrichList(facturas);
  }

  async findOne(id: string) {
    const factura = await this.facturaRepo.findOne({ where: { id }, relations: ['detalles'] });
    if (!factura) return null;
    const arr = await this._enrichList([factura]);
    return arr[0] || null;
  }

  async create(data: any) {
    const factura = this.facturaRepo.create(data);
    return this.facturaRepo.save(factura);
  }

  async findByPedidoId(pedidoId: string) {
    const factura = await this.facturaRepo.findOne({ where: { pedidoId }, relations: ['detalles'] });
    if (!factura) return null;
    const arr = await this._enrichList([factura]);
    return arr[0] || null;
  }

  async findByBodegueroId(bodegueroId: string) {
    try {
      const pedidoIds = await this.warehouseExternal.getPedidoIdsByBodeguero(bodegueroId);
      if (!pedidoIds || pedidoIds.length === 0) return [];
      const facturas = await this.facturaRepo.find({ where: { pedidoId: In(pedidoIds) }, relations: ['detalles'] });
      return this._enrichList(facturas);
    } catch (err) {
      this.logger.debug('findByBodegueroId failed', { bodegueroId, err: err?.message || err });
      return [];
    }
  }

  private async _enrichList(facturas: Factura[]): Promise<EnrichedFactura[]> {
    if (!Array.isArray(facturas) || facturas.length === 0) return [];

    // preload cxc rows
    const facturaIds = facturas.map(f => f.id);
    const cxcs = await this.cxcRepo.find({ where: { facturaId: In(facturaIds) } });
    const cxcByFactura: Record<string, CuentaPorCobrar | undefined> = {};
    for (const c of cxcs) cxcByFactura[c.facturaId] = c;

    // preload vendedores names
    const vendedorIds = Array.from(new Set(facturas.map(f => f.vendedorId).filter(Boolean as any)));
    const usuarios = vendedorIds.length ? await this.usuariosExternal.batchUsuarios(vendedorIds) : [];
    const userById: Record<string,string> = {};
    for (const u of usuarios) if (u?.id) userById[u.id] = u.nombre_completo || u.nombreCompleto || u.name || u.nombre || null;

    // preload pedido codes via orders service (best-effort)
    const enriched: EnrichedFactura[] = [];
    for (const f of facturas) {
      const out: EnrichedFactura = { ...(f as any) } as EnrichedFactura;
      out.detalles = (f as any).detalles || [];
      out.items_count = out.detalles?.length || 0;

      const cxc = cxcByFactura[f.id];
      if (cxc) {
        out.fecha_vencimiento = cxc.fechaVencimiento as any;
        out.saldo_pendiente = Number((cxc.montoOriginal || 0) as any) - Number((cxc.montoPagado || 0) as any);
      } else {
        out.fecha_vencimiento = null;
        out.saldo_pendiente = 0;
      }

      out.vendedor_nombre = f.vendedorId ? (userById[f.vendedorId] || null) : null;

      try {
        const pedido = await this.ordersExternal.getOrder(f.pedidoId);
        out.codigo_pedido = pedido?.codigoVisual || pedido?.codigo_visual || pedido?.numero || pedido?.id || null;
      } catch (e) {
        out.codigo_pedido = null;
      }

      enriched.push(out);
    }

    return enriched;
  }
}

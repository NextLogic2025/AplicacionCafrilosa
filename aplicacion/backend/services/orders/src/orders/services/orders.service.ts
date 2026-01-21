import { Injectable, NotFoundException, InternalServerErrorException, Inject, forwardRef, Logger, BadRequestException, ConflictException, HttpException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Pedido } from '../entities/pedido.entity';
import { DetallePedido } from '../entities/detalle-pedido.entity';
import { PromocionAplicada } from '../entities/promocion-aplicada.entity';
import { CreateOrderDto } from '../dto/requests/create-order.dto';
import { HistorialEstado } from '../entities/historial-estado.entity';
import { CartService } from './cart.service';
import { ServiceHttpClient } from '../../common/http/service-http-client.service';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);
  constructor(
    private dataSource: DataSource,
    @InjectRepository(Pedido) private readonly pedidoRepo: Repository<Pedido>,
    @Inject(forwardRef(() => CartService)) private readonly cartService: CartService,
    private readonly serviceHttp: ServiceHttpClient,
  ) { }

  // Verifica en la base de datos si una promoción (campaña) está vigente para un producto
  private async verificarVigenciaPromo(campaniaId: number, productoId: string): Promise<boolean> {
    if (!campaniaId) return false;
    // Preferir llamada al servicio Catalog si está disponible
    try {
      const data = await this.serviceHttp.get<any>(
        'catalog-service',
        `/promociones/${campaniaId}/productos`,
      );
      const items = Array.isArray(data?.items) ? data.items : [];
      return items.some((it: any) => String(it.id) === String(productoId) || String(it.producto_id) === String(productoId));
    } catch (err) {
      this.logger.warn('Error calling Catalog service to verify promo; falling back to invalid', { error: err?.message || err });
      return false;
    }
  }

  // Helpers para optimizaciones: batch prices, reserva y ubicación
  private async _getBatchPricesFromCatalog(createOrderDto: CreateOrderDto) {
    const productPayload = (createOrderDto.items || []).map(i => ({ id: i.producto_id, cantidad: i.cantidad }));
    try {
      const preciosBatch = await this.serviceHttp.post<any[]>(
        'catalog-service',
        '/precios/internal/batch-calculator',
        { items: productPayload, cliente_id: createOrderDto.cliente_id },
      );
      return preciosBatch || [];
    } catch (err) {
      this.logger.warn('Error fetching batch prices from catalog', { error: err?.message || err });
      return [];
    }
  }

  private async _reserveStockInWarehouse(createOrderDto: CreateOrderDto): Promise<string | null> {
    try {
      // Map items to the Warehouse reservations contract (productId, quantity)
      const payload = {
        tempId: null,
        items: (createOrderDto.items || []).map(i => ({ productId: (i as any).producto_id ?? (i as any).product_id, quantity: (i as any).cantidad ?? (i as any).quantity }))
      };
      const res = await this.serviceHttp.post<any>('warehouse-service', '/reservations', payload);
      // Warehouse returns { id }
      return res?.id ?? null;
    } catch (err) {
      this.logger.warn('Error reserving stock in warehouse', { error: err?.message || err });
      throw new BadRequestException('No se pudo reservar stock para el pedido');
    }
  }

  private async _resolveLocation(createOrderDto: CreateOrderDto) {
    try {
      if (createOrderDto.ubicacion?.lat && createOrderDto.ubicacion?.lng) return createOrderDto.ubicacion;
      if (createOrderDto.sucursal_id) {
        const suc = await this.serviceHttp.get<any>('catalog-service', `/sucursales/${createOrderDto.sucursal_id}`);
        if (suc?.location) return suc.location;
      }
      return null;
    } catch (err) {
      this.logger.warn('Error resolving location', { error: err?.message || err });
      return null;
    }
  }

  private async _rollbackReservation(reservationId: string | null) {
    if (!reservationId) return;
    try {
      // The warehouse exposes DELETE /reservations/:id to cancel a reservation
      await this.serviceHttp.delete('warehouse-service', `/reservations/${reservationId}`);
    } catch (e) {
      this.logger.warn('Error rolling back reservation', { reservationId, error: e?.message || e });
    }
  }

  async findAllByClient(userId: string): Promise<Pedido[]> {
    return this.pedidoRepo.find({
      where: [
        { cliente_id: userId },
        { vendedor_id: userId }
      ],
      relations: ['detalles'],
      order: { created_at: 'DESC' },
    });
  }

  async findAll(): Promise<Pedido[]> {
    return this.pedidoRepo.find({
      relations: ['detalles'],
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Pedido> {
    const pedido = await this.pedidoRepo.findOne({
      where: { id },
      relations: ['detalles'],
    });
    if (!pedido) throw new NotFoundException('El pedido con ID ' + id + ' no existe');
    return pedido;
  }

  async findAllByUser(userId: string, role: string): Promise<Pedido[]> {
    const qb = this.pedidoRepo.createQueryBuilder('o')
      .leftJoinAndSelect('o.detalles', 'd');

    if (String(role).toLowerCase() === 'cliente') {
      qb.where('o.cliente_id = :userId', { userId });
    } else if (String(role).toLowerCase() === 'vendedor') {
      qb.where('o.vendedor_id = :userId', { userId });
    }

    return qb.orderBy('o.created_at', 'DESC').getMany();
  }

  async create(createOrderDto: CreateOrderDto, usuarioId?: string, skipCartClear = false, skipPriceResolution = false): Promise<Pedido> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    let reservationId: string | null = null;

    try {
      // Paralelizar: reserva, resolución de ubicación y cálculo de precios en batch
      const promises: Promise<any>[] = [];
      promises.push(this._reserveStockInWarehouse(createOrderDto));
      promises.push(this._resolveLocation(createOrderDto));
      if (!skipPriceResolution) promises.push(this._getBatchPricesFromCatalog(createOrderDto));

      const results = await Promise.all(promises);
      // resultados posicionales: [reservationId, ubicacion?, precios?]
      reservationId = results[0] ?? null;
      let ubicacionPedido: { lng: number; lat: number } | null = null;
      let preciosBatch: any[] = [];
      if (results.length === 2) {
        if (Array.isArray(results[1])) preciosBatch = results[1]; else ubicacionPedido = results[1];
      }
      if (results.length === 3) {
        ubicacionPedido = results[1];
        preciosBatch = results[2];
      }

      const preciosMap = new Map<string, any>();
      (preciosBatch || []).forEach(p => preciosMap.set(String(p.producto_id), p));

      // Asignar precios desde map en memoria
      for (const item of createOrderDto.items) {
        if (!skipPriceResolution) {
          const precioInfo = preciosMap.get(String(item.producto_id));
          if (!precioInfo) throw new BadRequestException(`No se pudo obtener precio para ${item.producto_id}`);
          (item as any).precio_unitario = precioInfo.precio_final;
          (item as any).precio_original = precioInfo.precio_lista;
          (item as any).campania_aplicada_id = precioInfo.campania_id ?? (item as any).campania_aplicada_id ?? null;
        }
      }

      const subtotal = createOrderDto.items.reduce((acc, item) => acc + (Number((item as any).precio_unitario) * item.cantidad), 0);
      const descuento_total_calculado = createOrderDto.items.reduce((acc, item) => {
        const precioOriginal = Number((item as any).precio_original) || 0;
        const precioFinal = Number((item as any).precio_unitario) || 0;
        const descuentoLinea = precioOriginal > precioFinal ? (precioOriginal - precioFinal) * Number(item.cantidad) : 0;
        return acc + descuentoLinea;
      }, 0);

      const descuento_total = (createOrderDto.descuento_total ?? 0) + descuento_total_calculado;
      const impuestos_total = (subtotal - descuento_total) * 0.12;
      const total_final = subtotal - descuento_total + impuestos_total;

      const nuevoPedido = queryRunner.manager.create(Pedido, {
        cliente_id: createOrderDto.cliente_id,
        vendedor_id: createOrderDto.vendedor_id,
        sucursal_id: createOrderDto.sucursal_id || null,
        observaciones_entrega: createOrderDto.observaciones_entrega || null,
        forma_pago_solicitada: createOrderDto.forma_pago_solicitada || 'CONTADO',
        fecha_entrega_solicitada: createOrderDto.fecha_entrega_solicitada || null,
        origen_pedido: createOrderDto.origen_pedido || 'APP_MOVIL',
        subtotal,
        descuento_total,
        impuestos_total,
        total_final,
        estado_actual: 'PENDIENTE',
        reservation_id: reservationId || null,
      });

      const pedidoGuardado = await queryRunner.manager.save(nuevoPedido);

      if (ubicacionPedido) {
        try {
          await queryRunner.manager.query(
            `UPDATE pedidos SET ubicacion_pedido = ST_SetSRID(ST_MakePoint($1, $2), 4326) WHERE id = $3`,
            [ubicacionPedido.lng, ubicacionPedido.lat, pedidoGuardado.id]
          );
        } catch (e) { this.logger.warn('No se pudo guardar ubicacion en pedido', { error: e?.message || e }); }
      }

      // Validaciones de promoción y preparación de detalles en memoria
      const detallesEntities = [] as DetallePedido[];
      const promosEntities: any[] = [];
      for (const item of createOrderDto.items) {
        const tieneDescuento = (item as any).precio_original && (item as any).precio_original > (item as any).precio_unitario;
        if ((item as any).campania_aplicada_id && !tieneDescuento) {
          const esValida = await this.verificarVigenciaPromo((item as any).campania_aplicada_id, item.producto_id);
          if (!esValida) {
            this.logger.warn('Campaña ID ' + (item as any).campania_aplicada_id + ' para producto ' + item.producto_id + ' no tiene descuento real', { precio_original: (item as any).precio_original, precio_unitario: (item as any).precio_unitario });
            throw new ConflictException('La promoción para el producto ' + (item.nombre_producto || item.producto_id) + ' ha expirado o no es válida. Actualice el carrito.');
          }
        }

        const detalle = queryRunner.manager.create(DetallePedido, {
          pedido_id: pedidoGuardado.id,
          producto_id: item.producto_id,
          codigo_sku: item.codigo_sku || null,
          nombre_producto: item.nombre_producto || null,
          cantidad: item.cantidad,
          unidad_medida: item.unidad_medida || 'UN',
          precio_lista: (item as any).precio_original || (item as any).precio_unitario,
          precio_final: (item as any).precio_unitario,
          campania_aplicada_id: (item as any).campania_aplicada_id || null,
          motivo_descuento: item.motivo_descuento || null,
        });
        detallesEntities.push(detalle as any);

        if ((item as any).campania_aplicada_id) {
          const descuentoLinea = ((item as any).precio_original || (item as any).precio_unitario) - (item as any).precio_unitario;
          const montoAplicado = (descuentoLinea > 0 ? descuentoLinea * item.cantidad : 0);
          promosEntities.push(queryRunner.manager.create(PromocionAplicada, {
            pedido_id: pedidoGuardado.id,
            detalle_pedido_id: null, // se seteará después
            campania_id: (item as any).campania_aplicada_id,
            tipo_descuento: 'PORCENTAJE',
            valor_descuento: (item as any).precio_original != null ? ((item as any).precio_original - (item as any).precio_unitario) : 0,
            monto_aplicado: montoAplicado,
          }));
        }
      }

      // Guardar detalles en bulk
      const detallesGuardados = await queryRunner.manager.save(DetallePedido, detallesEntities as any[]);

      // Ajustar promociones para referenciar los detalles recién guardados
      if (promosEntities.length) {
        promosEntities.forEach((p, idx) => {
          p.detalle_pedido_id = detallesGuardados[idx] ? detallesGuardados[idx].id : null;
        });
        await queryRunner.manager.save(PromocionAplicada, promosEntities as any[]);
      }

      await queryRunner.commitTransaction();

      if (!skipCartClear) {
        try {
          if (usuarioId && createOrderDto.vendedor_id && usuarioId === createOrderDto.vendedor_id) {
            await this.cartService.clearCart(createOrderDto.cliente_id || usuarioId, createOrderDto.vendedor_id);
          } else if (usuarioId) {
            await this.cartService.clearCart(usuarioId);
          }
        } catch (cartError) {
          this.logger.warn('No se pudo vaciar el carrito', { error: cartError.message });
        }
      }

      return this.findOne(pedidoGuardado.id);

    } catch (err) {
      await queryRunner.rollbackTransaction();
      try { await this._rollbackReservation(reservationId); } catch (e) { /* swallow */ }

      this.logger.error('Error al crear pedido', { error: err?.message || err, stack: err?.stack, dto: createOrderDto });
      if (err instanceof BadRequestException || err instanceof ConflictException || err instanceof NotFoundException || err instanceof HttpException) {
        throw err;
      }
      throw new InternalServerErrorException(err?.message || 'No se pudo procesar el pedido.');
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Crea un pedido a partir del carrito del usuario `usuarioIdParam`.
   * - Resuelve items del carrito
   * - Construye un CreateOrderDto mínimo
   * - Llama a `create()` para persistir
   */
  async createFromCart(usuarioIdParam: string, actorUserId?: string, actorRole?: string, sucursal_id?: string, forma_pago_solicitada?: string, vendedorIdParam?: string | null): Promise<Pedido> {
    // 1. Obtener carrito EXACTO del actor
    // - Si vendedorIdParam es null -> cliente carrito (vendedor_id = null)
    // - Si vendedorIdParam tiene valor -> vendedor carrito (vendedor_id = vendedorIdParam)
    const cart = await this.cartService.getOrCreateCart(usuarioIdParam, vendedorIdParam ?? undefined);
    this.logger.debug('Cart obtained', { cart_id: cart?.id, usuario_id: cart?.usuario_id, vendedor_id: cart?.vendedor_id, items_count: cart?.items?.length });
    if (!cart || !cart.items || cart.items.length === 0) {
      throw new BadRequestException('Carrito vacío, no hay items para crear el pedido');
    }

    // 2. Resolver cliente_id y vendedor_id según actor
    let clienteId = cart.cliente_id ?? null;
    let pedidoVendedorId: string | null = null;

    if (actorRole === 'vendedor') {
      pedidoVendedorId = actorUserId ?? vendedorIdParam ?? null;
    }
    if (!clienteId && actorRole === 'cliente') clienteId = actorUserId || null;

    if (!clienteId) throw new BadRequestException('No se pudo resolver cliente para crear el pedido');

    // Si el actor es cliente, intentar resolver el `vendedor_asignado_id` desde Catalog internal
    if (actorRole === 'cliente') {
      try {
        const clientInfo = await this.serviceHttp.get<any>(
          'catalog-service',
          `/internal/clients/${clienteId}`,
        );
        pedidoVendedorId = clientInfo?.vendedor_asignado_id ?? null;
        this.logger.debug('Resolved vendedor_asignado_id from Catalog', { cliente_id: clienteId, vendedor_asignado_id: pedidoVendedorId });
      } catch (err) {
        this.logger.warn('No se pudo obtener vendedor asignado del cliente desde Catalog', { error: err?.message || err });
      }
    }

    // 3. Construir CreateOrderDto con items del carrito (sin precios, el create() los resolverá)
    // ADEMÁS: Resolver codigo_sku y nombre_producto desde Catalog
    let items: any[] = cart.items.map((it: any) => ({
      producto_id: it.producto_id,
      cantidad: it.cantidad,
      codigo_sku: null,
      nombre_producto: null,
      unidad_medida: 'UN',
      campania_aplicada_id: it.campania_aplicada_id ?? null,
      motivo_descuento: it.motivo_descuento ?? null,
    }));

    // Intentar enriquecer items con datos del Catalog (codigo_sku, nombre_producto)
    try {
      const productIds = items.map(i => i.producto_id);
      const products = await this.serviceHttp.post<any[]>(
        'catalog-service',
        '/products/internal/batch',
        { ids: productIds, cliente_id: clienteId },
      );
      const productMap = Array.isArray(products)
        ? products.reduce((acc: any, p: any) => { acc[p.id] = p; return acc; }, {})
        : {};
      items = items.map(item => ({
        ...item,
        codigo_sku: productMap[item.producto_id]?.codigo_sku ?? item.codigo_sku,
        nombre_producto: productMap[item.producto_id]?.nombre ?? item.nombre_producto,
      }));
      this.logger.debug('Enriquecidos items con datos del Catalog', { items_count: items.length });
    } catch (err) {
      this.logger.warn('No se pudieron obtener detalles de productos desde Catalog', { error: err?.message || err });
    }

    const dto: any = {
      cliente_id: clienteId,
      vendedor_id: pedidoVendedorId,
      sucursal_id: sucursal_id || null,
      forma_pago_solicitada: forma_pago_solicitada,
      items,
      origen_pedido: 'FROM_CART',
      ubicacion: null,
    };

    // 4. Crear pedido
    const pedido = await this.create(dto as any, actorUserId, true);

    // 5. Limpiar el carrito correcto despues de crear el pedido (usar el ID exacto del carrito usado)
    try {
      await this.cartService.clearCartById(cart.id);
      this.logger.debug('Cleared cart after order creation', { cart_id: cart.id, usuario_id: cart.usuario_id, vendedor_id: cart.vendedor_id });
    } catch (cartError) {
      this.logger.warn('No se pudo vaciar el carrito despues de crear pedido', { cart_id: cart.id, error: cartError?.message || String(cartError) });
    }

    return pedido;
  }

  async getOrderDetailProfessional(orderId: string): Promise<Pedido> {
    const pedido = await this.pedidoRepo.createQueryBuilder('pedido')
      // Join con estados para obtener el 'nombre_visible' (Requisito SQL)
      .leftJoinAndSelect('pedido.detalles', 'detalle')
      .leftJoin('estados_pedido', 'estado', 'estado.codigo = pedido.estado_actual')
      .addSelect(['estado.nombre_visible', 'estado.descripcion'])
      // Join con historial para el timeline del frontend
      .leftJoinAndMapMany('pedido.historial', 'historial_estados', 'h', 'h.pedido_id = pedido.id')
      .where('pedido.id = :id', { id: orderId })
      .getOne();

    if (!pedido) throw new NotFoundException('Pedido no encontrado');
    return pedido;
  }

  /**
 * Cambia el estado del pedido y registra el historial.
 * Este método es usado por Bodega, Transporte o Admin.
 */
  async updateStatus(
    pedidoId: string,
    nuevoEstado: string,
    usuarioId: string,
    comentario?: string
  ): Promise<Pedido> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const pedido = await queryRunner.manager.findOne(Pedido, { where: { id: pedidoId } });
      if (!pedido) throw new NotFoundException('Pedido no encontrado');

      const estadoAnterior = pedido.estado_actual;

      // Validación: impedir pasar a EN_RUTA si el picking no fue completado (debe estar PREPARADO)
      if (String(nuevoEstado).toUpperCase() === 'EN_RUTA' && String(estadoAnterior).toUpperCase() !== 'PREPARADO') {
        throw new BadRequestException('No se puede cambiar a EN_RUTA: el picking no está completado o pedido no está PREPARADO');
      }

      // 1. Actualizar cabecera del pedido
      pedido.estado_actual = nuevoEstado;
      await queryRunner.manager.save(pedido);

      // 2. Crear entrada en el historial (Requisito de Auditoría)
      const historial = queryRunner.manager.create(HistorialEstado, {
        pedido_id: pedidoId,
        estado_anterior: estadoAnterior,
        estado_nuevo: nuevoEstado,
        usuario_id: usuarioId,
        comentario: comentario || ('Cambio de estado de ' + estadoAnterior + ' a ' + nuevoEstado)
      });
      await queryRunner.manager.save(historial);

      // Al hacer commit, se dispararán los triggers de pg_notify del SQL
      await queryRunner.commitTransaction();
      // If the pedido was set to ANULADO, attempt to release warehouse reservation
      try {
        const estadoUpper = String(nuevoEstado).toUpperCase();
        if (estadoUpper === 'ANULADO' || estadoUpper === 'RECHAZADO') {
          // try to obtain reservation_id
          try {
            const res = await queryRunner.manager.query('SELECT reservation_id FROM pedidos WHERE id = $1', [pedidoId]);
            const reservationId = res && res[0] ? res[0].reservation_id || null : null;
            if (reservationId) {
              await this.serviceHttp.delete('warehouse-service', `/reservations/${reservationId}`);
              this.logger.debug('Released warehouse reservation after pedido ' + estadoUpper, { pedidoId, reservationId });
            }
          } catch (err) {
            this.logger.warn('Could not release warehouse reservation after pedido ' + estadoUpper, { pedidoId, error: err?.message || err });
          }
        }
      } catch (e) {
        this.logger.warn('Unexpected error in post-updateStatus release logic', { error: e?.message || e });
      }

      return this.findOne(pedidoId);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async listPedidosPaginados(clienteId: string, page = 1, limit = 10) {
    const [data, total] = await this.pedidoRepo.findAndCount({
      where: { cliente_id: clienteId },
      order: { created_at: 'DESC' },
      take: limit,
      skip: (page - 1) * limit,
    });

    return {
      data,
      meta: {
        totalItems: total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Cancela un pedido cambiando su estado a ANULADO.
   * Solo se puede cancelar si está en estado PENDIENTE.
   * @param pedidoId - UUID del pedido
   * @param usuarioId - UUID del usuario que solicita la cancelación (opcional)
   * @param motivo - Motivo de la cancelación (opcional)
   */
  async cancelOrder(
    pedidoId: string,
    usuarioId?: string,
    motivo?: string
  ): Promise<Pedido> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const pedido = await queryRunner.manager.findOne(Pedido, { where: { id: pedidoId } });

      if (!pedido) {
        throw new NotFoundException('Pedido no encontrado');
      }

      // Validar que el pedido esté en estado PENDIENTE
      const estadosPermitidos = ['PENDIENTE', 'APROBADO'];
      if (!estadosPermitidos.includes(pedido.estado_actual)) {
        const joinEstados = estadosPermitidos.join(', ');
        throw new BadRequestException('No se puede cancelar un pedido en estado ' + pedido.estado_actual + '. Solo se permiten estados: ' + joinEstados);
      }

      const estadoAnterior = pedido.estado_actual;

      // 1. Actualizar estado a ANULADO
      pedido.estado_actual = 'ANULADO';
      await queryRunner.manager.save(pedido);

      // 2. Crear entrada en el historial (usuario_id es opcional en la BD)
      const historial = queryRunner.manager.create(HistorialEstado, {
        pedido_id: pedidoId,
        estado_anterior: estadoAnterior,
        estado_nuevo: 'ANULADO',
        usuario_id: usuarioId || null,
        comentario: motivo || 'Pedido cancelado por el cliente'
      });
      await queryRunner.manager.save(historial);

      await queryRunner.commitTransaction();

      this.logger.debug('Pedido ' + pedidoId + ' cancelado por usuario ' + (usuarioId || 'desconocido'));
      // After successfully cancelling the pedido, attempt to release warehouse reservation if present
      try {
        try {
          const res = await queryRunner.manager.query('SELECT reservation_id FROM pedidos WHERE id = $1', [pedidoId]);
          const reservationId = res && res[0] ? res[0].reservation_id || null : null;
          if (reservationId) {
            await this.serviceHttp.delete('warehouse-service', `/reservations/${reservationId}`);
            this.logger.debug('Released warehouse reservation after cancelOrder', { pedidoId, reservationId });
          }
        } catch (err) {
          this.logger.warn('Could not release warehouse reservation after cancelOrder', { pedidoId, error: err?.message || err });
        }
      } catch (e) {
        this.logger.warn('Unexpected error in post-cancel release logic', { error: e?.message || e });
      }

      return this.findOne(pedidoId);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      this.logger.error('Error al cancelar pedido', { error: err.message, pedidoId });
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Aplica el resultado del picking al pedido: ajusta cantidades cuando difieren,
   * escribe `motivo_ajuste`, recalcula totales y opcionalmente llama a Finance
   * para crear la factura.
   * Payload esperado: { pickingId?: string, items: [{ producto_id, cantidad_pickeada, motivo_ajuste? }] }
   */
  async applyPickingResult(pedidoId: string, payload: any) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const pedido = await queryRunner.manager.findOne(Pedido, { where: { id: pedidoId }, relations: ['detalles'] });
      if (!pedido) throw new NotFoundException('Pedido no encontrado');

      const itemsFromPicking: Array<any> = Array.isArray(payload.items) ? payload.items : [];

      // Mapear por producto para facilidad. Soportar tanto `producto_id` como `productId`.
      const pickingMap: Record<string, any> = {};
      for (const it of itemsFromPicking) {
        const key = String((it as any).producto_id ?? (it as any).productId ?? (it as any).productoId ?? (it as any).product_id);
        pickingMap[key] = it;
      }

      // Ajustes por detalle (modificar en memoria y guardar en bulk)
      let recalculatedSubtotal = 0;
      const detallesToSave: any[] = [];
      for (const detalle of pedido.detalles || []) {
        const p = pickingMap[String(detalle.producto_id)];
        if (p && p.cantidad_pickeada != null) {
          const picked = Number(p.cantidad_pickeada);
          const original = Number(detalle.cantidad);
          if (picked !== original) {
            detalle.cantidad_solicitada = original as any;
            detalle.motivo_ajuste = p.motivo_ajuste || p.motivo_desviacion || ('Ajuste por picking ' + (payload.pickingId || ''));
            detalle.cantidad = picked as any;
            detallesToSave.push(detalle);
            continue; // ya acumulado, sumar en siguiente sección
          }
        }
        // No modificado: igualmente sumar al subtotal
      }

      // Recalcular subtotal sumando todas las cantidades actuales
      for (const detalle of pedido.detalles || []) {
        const precioFinal = Number(detalle.precio_final || 0);
        const cantidad = Number(detalle.cantidad || 0);
        recalculatedSubtotal += precioFinal * cantidad;
      }

      if (detallesToSave.length) {
        await queryRunner.manager.save(DetallePedido, detallesToSave);
      }

      // Recalcular totales
      const descuento_total = Number(pedido.descuento_total || 0);
      const impuestos_total = Number((recalculatedSubtotal - descuento_total) * 0.12);
      const total_final = recalculatedSubtotal - descuento_total + impuestos_total;

      const previousEstado = pedido.estado_actual;

      pedido.subtotal = recalculatedSubtotal as any;
      pedido.impuestos_total = impuestos_total as any;
      pedido.total_final = total_final as any;
      pedido.estado_actual = 'PREPARADO';

      await queryRunner.manager.save(pedido);

      // Registrar en historial (usar estado anterior real)
      const historial = queryRunner.manager.create(HistorialEstado, {
        pedido_id: pedidoId,
        estado_anterior: previousEstado,
        estado_nuevo: 'PREPARADO',
        usuario_id: null,
        comentario: 'Reconciliado con resultado de picking' + (payload.pickingId ? (' id:' + payload.pickingId) : ''),
      });
      await queryRunner.manager.save(historial);

      // Llamar a Finance para crear factura (idempotente si ya existe factura_id)
      try {
        if (!pedido.factura_id) {
          // Enriquecer con datos fiscales del cliente desde Catalog (internal)
          let clienteFiscal: any = null;
          try {
            clienteFiscal = await this.serviceHttp.get<any>('catalog-service', `/internal/clients/${pedido.cliente_id}`);
          } catch (e) {
            this.logger.warn('No se pudo obtener datos fiscales del cliente desde catalog', { cliente_id: pedido.cliente_id, error: e?.message || e });
          }

          const rucCliente = clienteFiscal?.identificacion ?? clienteFiscal?.cliente_identificacion ?? '0000000000';
          const razonSocialCliente = clienteFiscal?.razon_social ?? clienteFiscal?.razonSocial ?? ('Cliente ' + (pedido.cliente_id || '').slice(0, 8));

          const facturaPayload: any = {
            pedidoId: pedido.id,
            clienteId: pedido.cliente_id,
            vendedorId: pedido.vendedor_id || null,
            rucCliente,
            razonSocialCliente,
            subtotal: pedido.subtotal,
            impuestos: pedido.impuestos_total,
            totalFinal: pedido.total_final,
            detalles: (pedido.detalles || []).map((d: any) => ({
              productoId: d.producto_id,
              descripcion: d.nombre_producto || d.codigo_sku || null,
              cantidad: Number(d.cantidad),
              precioUnitario: Number(d.precio_final),
              totalLinea: Number(d.cantidad) * Number(d.precio_final),
            })),
          };

          const resp = await this.serviceHttp.post<any>('finance-service', '/api/facturas/internal', facturaPayload);
          if (resp && resp.id) {
            pedido.factura_id = resp.id;
            pedido.factura_numero = resp.numero || resp.facturaNumero || null;
            pedido.url_pdf_factura = resp.url_pdf_factura || resp.url || null;
            pedido.estado_actual = 'FACTURADO';
            await queryRunner.manager.save(pedido);
          }
        }
      } catch (finErr) {
        this.logger.warn('No se pudo crear factura en finance-service', { error: finErr?.message || finErr });
      }

      await queryRunner.commitTransaction();

      return this.findOne(pedidoId);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      this.logger.error('Error al aplicar resultado de picking', { error: err?.message || err, payload });
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}





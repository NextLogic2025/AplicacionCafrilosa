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

  async create(createOrderDto: CreateOrderDto, usuarioId?: string, skipCartClear = false): Promise<Pedido> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    // Variables que deben estar en scope para manejar compensación en catch
    let reservationId: string | null = null;

    try {
      // Antes de calcular totales, obtener precios canónicos desde Catalog
      // Reserva síncrona en Warehouse (Camino Dorado)
      try {
        const tempId = (globalThis as any).crypto && typeof (globalThis as any).crypto.randomUUID === 'function'
          ? (globalThis as any).crypto.randomUUID()
          : ('resv-' + Date.now() + '-' + Math.random().toString(36).slice(2));

        const reservationBody = {
          items: (createOrderDto.items || []).map((it: any) => ({
            producto_id: it.producto_id ?? it.productId,
            cantidad: it.cantidad ?? it.quantity,
            // Propagar sku/codigo_sku tal cual vienen; NO adivinar valores alternativos
            sku: it.sku ?? null,
            codigo_sku: it.codigo_sku ?? null,
          })),
          temp_id: tempId,
          pedido_temp_id: tempId
        };

        this.logger.debug('Attempting warehouse reservation', { items: reservationBody.items?.length });
        // Log payload to help debugging propagation of sku to Warehouse
        this.logger.debug('Reservation payload', { reservationBody });
        const data = await this.serviceHttp.post<any>(
          'warehouse-service',
          '/reservations',
          reservationBody,
        );
        reservationId = data?.id ?? tempId;
        this.logger.debug('Warehouse reservation created', { reservationId });
      } catch (resErr) {
        this.logger.warn('Reservation error, aborting order create', { error: resErr?.message || resErr });
        // Exponer error hacia el cliente: stock insuficiente o warehouse caído
        if (resErr instanceof BadRequestException) throw resErr;
        if (resErr instanceof HttpException && resErr.getStatus() === 409) {
          throw new BadRequestException('Stock insuficiente para los items del pedido');
        }
        throw new BadRequestException('Stock insuficiente o servicio de Warehouse no disponible');
      }

      for (const item of createOrderDto.items) {
        try {
          // 1) Intentar obtener la mejor promoción para el cliente
          let best: any = null;
          try {
            best = await this.serviceHttp.get<any>(
              'catalog-service',
              `/promociones/internal/mejor/producto/${item.producto_id}?cliente_id=${createOrderDto.cliente_id}`,
            );
          } catch (err) {
            this.logger.debug('Catalog promo call not ok', { producto_id: item.producto_id, error: err?.message || err });
          }

          if (best && best.precio_final != null) {
            // Sobrescribir datos del item
            (item as any).precio_original = best.precio_lista ?? null;
            (item as any).precio_unitario = best.precio_final;
            (item as any).campania_aplicada_id = best.campania_id ?? (item as any).campania_aplicada_id ?? null;
          } else {
            // 2) Fallback: solicitar precios desde /precios/producto/:id y escoger el menor
            try {
              const precios = await this.serviceHttp.get<any>(
                'catalog-service',
                `/precios/internal/producto/${item.producto_id}`,
              );
              const arr = Array.isArray(precios) ? precios : (precios || []);
              if (arr.length) {
                const min = Math.min(...arr.map((p: any) => Number(p.precio || p.price || 0)));
                (item as any).precio_original = min;
                (item as any).precio_unitario = min;
              } else {
                throw new BadRequestException('No hay precio disponible para el producto ' + item.producto_id);
              }
            } catch (err) {
              this.logger.warn('Catalog precios call failed', { producto_id: item.producto_id, error: err?.message || err });
              throw new BadRequestException('No se pudo obtener precio para producto ' + item.producto_id);
            }
          }
        } catch (err) {
          this.logger.warn('Error al resolver precio/campaña para item', { producto: item.producto_id, err: err?.message || err });
          throw new BadRequestException('Error validando precio para producto ' + item.producto_id);
        }
      }

      const subtotal = createOrderDto.items.reduce((acc, item) => acc + (Number((item as any).precio_unitario) * item.cantidad), 0);

      // CALCULAR DESCUENTO TOTAL basado en los descuentos de cada item
      // descuento por item = (precio_original - precio_unitario) * cantidad
      const descuento_total_calculado = createOrderDto.items.reduce((acc, item) => {
        const precioOriginal = Number((item as any).precio_original) || 0;
        const precioFinal = Number((item as any).precio_unitario) || 0;
        const descuentoLinea = precioOriginal > precioFinal ? (precioOriginal - precioFinal) * Number(item.cantidad) : 0;
        return acc + descuentoLinea;
      }, 0);

      // Si el DTO tiene descuento_total explícito, sumarlo (descuentos adicionales)
      const descuento_total = (createOrderDto.descuento_total ?? 0) + descuento_total_calculado;
      const impuestos_total = (subtotal - descuento_total) * 0.12;
      const total_final = subtotal - descuento_total + impuestos_total;

      // RESOLVER UBICACIÓN: Si hay sucursal_id → ubicación de sucursal, si no → ubicación del cliente
      let ubicacionPedido: { lng: number; lat: number } | null = null;
      if (createOrderDto.ubicacion?.lat && createOrderDto.ubicacion?.lng) {
        // Si viene ubicación explícita en el DTO, usarla
        ubicacionPedido = { lng: createOrderDto.ubicacion.lng, lat: createOrderDto.ubicacion.lat };
      } else {
        try {
          // Intentar obtener ubicación desde Catalog (cliente o sucursal)
          const path = createOrderDto.sucursal_id
            ? `/internal/sucursales/${createOrderDto.sucursal_id}`
            : `/internal/clients/${createOrderDto.cliente_id}`;
          this.logger.debug('Fetching ubicaci▋ desde Catalog', { path });
          const data = await this.serviceHttp.get<any>('catalog-service', path);
          const ubicacion_gps = data?.ubicacion_gps || data?.ubicacion_direccion;
          if (ubicacion_gps && typeof ubicacion_gps === 'object' && ubicacion_gps.coordinates) {
            // GeoJSON format: [lng, lat]
            ubicacionPedido = { lng: ubicacion_gps.coordinates[0], lat: ubicacion_gps.coordinates[1] };
          } else if (data?.lat && data?.lng) {
            ubicacionPedido = { lng: data.lng, lat: data.lat };
          }
        } catch (err) {
          this.logger.debug('No se pudo obtener ubicación desde Catalog', { error: err?.message || err });
        }
      }

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

      // Guardar ubicación si se resolvió
      if (ubicacionPedido) {
        await queryRunner.manager.query(
          `UPDATE pedidos SET ubicacion_pedido = ST_SetSRID(ST_MakePoint($1, $2), 4326) WHERE id = $3`,
          [ubicacionPedido.lng, ubicacionPedido.lat, pedidoGuardado.id]
        );
      }

      const detallesGuardados: DetallePedido[] = [];
      for (const item of createOrderDto.items) {
        const tieneDescuento = (item as any).precio_original && (item as any).precio_original > (item as any).precio_unitario;

        // Si el frontend declara una campaña aplicada Y hay descuento real, confiar en que fue validada en el carrito
        // Solo hacer validación estricta si NO hay descuento (indica que la promo puede haber expirado)
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
        const saved = await queryRunner.manager.save(DetallePedido, detalle);
        detallesGuardados.push(saved);

        // Guardar promoción aplicada si el frontend indicó una campaña
        if ((item as any).campania_aplicada_id) {
          try {
            const descuentoLinea = ((item as any).precio_original || (item as any).precio_unitario) - (item as any).precio_unitario;
            const montoAplicado = (descuentoLinea > 0 ? descuentoLinea * item.cantidad : 0);
            const promocion = queryRunner.manager.create(PromocionAplicada, {
              pedido_id: pedidoGuardado.id,
              detalle_pedido_id: saved.id,
              campania_id: (item as any).campania_aplicada_id,
              tipo_descuento: 'PORCENTAJE',
              valor_descuento: (item as any).precio_original != null ? ((item as any).precio_original - (item as any).precio_unitario) : 0,
              monto_aplicado: montoAplicado,
            });
            await queryRunner.manager.save(PromocionAplicada, promocion);
          } catch (promoErr) {
            this.logger.warn('No se pudo guardar la promoción aplicada', { error: promoErr?.message, campania_id: (item as any).campania_aplicada_id });
          }
        }
      }

      await queryRunner.commitTransaction();

      if (!skipCartClear) {
        try {
          // Limpiar carrito: si fue creado por vendedor, limpiar su carrito (vendedor_id)
          // Si fue creado por cliente, limpiar su carrito (sin vendedor_id)
          if (usuarioId && createOrderDto.vendedor_id && usuarioId === createOrderDto.vendedor_id) {
            // Carrito del vendedor
            await this.cartService.clearCart(createOrderDto.cliente_id || usuarioId, createOrderDto.vendedor_id);
          } else if (usuarioId) {
            // Carrito del cliente
            await this.cartService.clearCart(usuarioId);
          }
        } catch (cartError) {
          this.logger.warn('No se pudo vaciar el carrito', { error: cartError.message });
        }
      }
      return this.findOne(pedidoGuardado.id);

    } catch (err) {
      await queryRunner.rollbackTransaction();
      // Intentar liberar la reserva en Warehouse si existe
      try {
        if (typeof reservationId !== 'undefined' && reservationId) {
          try {
              await this.serviceHttp.delete('warehouse-service', `/reservations/${reservationId}`);
              this.logger.debug('Released warehouse reservation after rollback', { reservationId });
          } catch (releaseErr) {
            this.logger.error('CRÍTICO: No se pudo liberar la reserva en Warehouse tras rollback', { reservationId, error: releaseErr?.message || releaseErr });
          }
        }
      } catch (e) {
        this.logger.warn('Error intentando liberar reserva', { error: e?.message || e });
      }

      this.logger.error('Error al crear pedido', { error: err.message, stack: err.stack, dto: createOrderDto });
      throw new InternalServerErrorException('No se pudo procesar el pedido.');
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
}





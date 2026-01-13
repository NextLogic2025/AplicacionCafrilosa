import { Injectable, NotFoundException, InternalServerErrorException, Inject, forwardRef, Logger, BadRequestException, ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Pedido } from '../entities/pedido.entity';
import { DetallePedido } from '../entities/detalle-pedido.entity';
import { PromocionAplicada } from '../entities/promocion-aplicada.entity';
import { CreateOrderDto } from '../dto/requests/create-order.dto';
import { HistorialEstado } from '../entities/historial-estado.entity';
import { CartService } from './cart.service';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private dataSource: DataSource,
    @InjectRepository(Pedido) private readonly pedidoRepo: Repository<Pedido>,
    @Inject(forwardRef(() => CartService)) private readonly cartService: CartService,
    private readonly configService: ConfigService,
  ) {}

  // Verifica en la base de datos si una promoción (campaña) está vigente para un producto
  private async verificarVigenciaPromo(campaniaId: number, productoId: string): Promise<boolean> {
    if (!campaniaId) return false;
    // Preferir llamada al servicio Catalog si está disponible
    const base = this.configService.get<string>('CATALOG_SERVICE_URL') || process.env.CATALOG_SERVICE_URL || 'http://catalog-service:3000';
    const url = `${base.replace(/\/+$/, '')}/promociones/${campaniaId}/productos`;
    try {
      const fetchFn = (globalThis as any).fetch;
      if (typeof fetchFn !== 'function') {
        this.logger.debug('fetch not available in runtime; cannot verify promo via HTTP');
        return false;
      }
      const resp: any = await fetchFn(url);
      if (!resp || !resp.ok) return false;
      const data = await resp.json();
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

  async findOne(id: string): Promise<Pedido> {
    const pedido = await this.pedidoRepo.findOne({
      where: { id },
      relations: ['detalles'],
    });
    if (!pedido) throw new NotFoundException(`El pedido con ID ${id} no existe`);
    return pedido;
  }

  async findAllByUser(userId: string, role: string): Promise<Pedido[]> {
    const qb = this.pedidoRepo.createQueryBuilder('o');
    if (String(role).toLowerCase() === 'cliente') {
      qb.where('o.cliente_id = :userId', { userId });
    } else if (String(role).toLowerCase() === 'vendedor') {
      qb.where('o.vendedor_id = :userId', { userId });
    }
    return qb.orderBy('o.created_at', 'DESC').getMany();
  }

  async create(createOrderDto: CreateOrderDto): Promise<Pedido> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const subtotal = createOrderDto.items.reduce((acc, item) => acc + (item.precio_unitario * item.cantidad), 0);
      const descuento_total = createOrderDto.descuento_total ?? 0;
      const impuestos_total = (subtotal - descuento_total) * 0.12;
      const total_final = subtotal - descuento_total + impuestos_total;

      const nuevoPedido = queryRunner.manager.create(Pedido, {
        cliente_id: createOrderDto.cliente_id,
        vendedor_id: createOrderDto.vendedor_id,
        sucursal_id: createOrderDto.sucursal_id || null,
        observaciones_entrega: createOrderDto.observaciones_entrega || null,
        condicion_pago: createOrderDto.condicion_pago || 'CONTADO',
        fecha_entrega_solicitada: createOrderDto.fecha_entrega_solicitada || null,
        origen_pedido: createOrderDto.origen_pedido || 'APP_MOVIL',
        subtotal,
        descuento_total,
        impuestos_total,
        total_final,
        estado_actual: 'PENDIENTE',
      });

      const pedidoGuardado = await queryRunner.manager.save(nuevoPedido);

      if (createOrderDto.ubicacion?.lat && createOrderDto.ubicacion?.lng) {
        await queryRunner.manager.query(
          `UPDATE pedidos SET ubicacion_pedido = ST_SetSRID(ST_MakePoint($1, $2), 4326) WHERE id = $3`,
          [createOrderDto.ubicacion.lng, createOrderDto.ubicacion.lat, pedidoGuardado.id]
        );
      }

      const detallesGuardados: DetallePedido[] = [];
      for (const item of createOrderDto.items) {
        const tieneDescuento = item.precio_original && item.precio_original > item.precio_unitario;

        // Si el frontend declara una campaña aplicada, verificar su vigencia en BD
        if (item.campania_aplicada_id) {
          const esValida = await this.verificarVigenciaPromo(item.campania_aplicada_id, item.producto_id);
          if (!esValida) {
            throw new ConflictException(`La promoción para el producto ${item.nombre_producto || item.producto_id} ha expirado o no es válida. Actualice el carrito.`);
          }
        }

        const detalle = queryRunner.manager.create(DetallePedido, {
          pedido_id: pedidoGuardado.id,
          producto_id: item.producto_id,
          codigo_sku: item.codigo_sku || null,
          nombre_producto: item.nombre_producto || null,
          cantidad: item.cantidad,
          unidad_medida: item.unidad_medida || 'UN',
          precio_lista: item.precio_original || item.precio_unitario,
          precio_original_snapshot: tieneDescuento ? item.precio_original : null,
          precio_final: item.precio_unitario,
          campania_aplicada_id: item.campania_aplicada_id || null,
          precio_timestamp: new Date(),
          motivo_descuento: item.motivo_descuento || null,
        });
        const saved = await queryRunner.manager.save(DetallePedido, detalle);
        detallesGuardados.push(saved);

        // Guardar promoción aplicada si el frontend indicó una campaña
        if (item.campania_aplicada_id) {
          const descuentoLinea = (item.precio_original || item.precio_unitario) - item.precio_unitario;
          const montoAplicado = (descuentoLinea > 0 ? descuentoLinea * item.cantidad : 0);
          const promocion = queryRunner.manager.create(PromocionAplicada, {
            pedido_id: pedidoGuardado.id,
            detalle_pedido_id: saved.id,
            campaña_id: item.campania_aplicada_id,
            tipo_descuento: 'PORCENTAJE',
            valor_descuento: item.precio_original != null ? (item.precio_original - item.precio_unitario) : 0,
            monto_aplicado: montoAplicado,
          });
          await queryRunner.manager.save(PromocionAplicada, promocion);
        }
      }

      await queryRunner.commitTransaction();

      try {
        await this.cartService.clearCart(createOrderDto.vendedor_id);
      } catch (cartError) {
        this.logger.warn('No se pudo vaciar el carrito', { error: cartError.message });
      }

      return this.findOne(pedidoGuardado.id);

    } catch (err) {
      await queryRunner.rollbackTransaction();
      this.logger.error('Error al crear pedido', { error: err.message, stack: err.stack, dto: createOrderDto });
      throw new InternalServerErrorException('No se pudo procesar el pedido.');
    } finally {
      await queryRunner.release();
    }
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

      // 1. Actualizar cabecera del pedido
      pedido.estado_actual = nuevoEstado;
      await queryRunner.manager.save(pedido);

      // 2. Crear entrada en el historial (Requisito de Auditoría)
      const historial = queryRunner.manager.create(HistorialEstado, {
        pedido_id: pedidoId,
        estado_anterior: estadoAnterior,
        estado_nuevo: nuevoEstado,
        usuario_id: usuarioId,
        comentario: comentario || `Cambio de estado de ${estadoAnterior} a ${nuevoEstado}`
      });
      await queryRunner.manager.save(historial);

      // Al hacer commit, se dispararán los triggers de pg_notify del SQL
      await queryRunner.commitTransaction();
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
        throw new BadRequestException(
          `No se puede cancelar un pedido en estado ${pedido.estado_actual}. Solo se permiten estados: ${estadosPermitidos.join(', ')}`
        );
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
      
      this.logger.log(`Pedido ${pedidoId} cancelado por usuario ${usuarioId || 'desconocido'}`);
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
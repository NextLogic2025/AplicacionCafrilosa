import { Injectable, NotFoundException, InternalServerErrorException, Inject, forwardRef, Logger } from '@nestjs/common';
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
  ) {}

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
          campania_aplicada_id: tieneDescuento ? (item.campania_aplicada_id || null) : null,
          precio_timestamp: new Date(),
          motivo_descuento: item.motivo_descuento || null,
        });
        const saved = await queryRunner.manager.save(DetallePedido, detalle);
        detallesGuardados.push(saved);

        // Guardar promoción aplicada si hay descuento
        if (tieneDescuento && item.motivo_descuento) {
          const descuentoLinea = (item.precio_original - item.precio_unitario) * item.cantidad;
          const promocion = queryRunner.manager.create(PromocionAplicada, {
            pedido_id: pedidoGuardado.id,
            detalle_pedido_id: saved.id,
            campaña_id: item.campania_aplicada_id || null,
            tipo_descuento: 'PORCENTAJE',
            valor_descuento: item.precio_original - item.precio_unitario,
            monto_aplicado: descuentoLinea,
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
}
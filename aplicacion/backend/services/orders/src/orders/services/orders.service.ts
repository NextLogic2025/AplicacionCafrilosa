import { Injectable, NotFoundException, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Pedido } from '../entities/pedido.entity';
import { DetallePedido } from '../entities/detalle-pedido.entity';
import { CreateOrderDto } from '../dto/requests/create-order.dto';
import { HistorialEstado } from '../entities/historial-estado.entity';

@Injectable()
export class OrdersService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(Pedido) private readonly pedidoRepo: Repository<Pedido>,
  ) { }

  async findAllByClient(clienteId: string): Promise<Pedido[]> {
    return this.pedidoRepo.find({
      where: { cliente_id: clienteId },
      order: { fecha_creacion: 'DESC' },
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

  /**
   * Creación de pedido con Transacción Atómica
   * Cumple con el requisito de integridad de datos "Cloud Code"
   */
  async create(createOrderDto: CreateOrderDto): Promise<Pedido> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Calcular totales (Lógica de negocio)
      const neto = createOrderDto.items.reduce((acc, item) => acc + (item.precio_unitario * item.cantidad), 0);
      const impuestos = neto * 0.15; // Ejemplo 15%
      const total = neto + impuestos;

      // 2. Crear cabecera
      const nuevoPedido = queryRunner.manager.create(Pedido, {
        ...createOrderDto,
        total_neto: neto,
        total_impuestos: impuestos,
        total_pedido: total,
        estado_actual: 'PENDIENTE',
      });

      const pedidoGuardado = await queryRunner.manager.save(nuevoPedido);

      // 3. Crear detalles vinculados
      const detalles = createOrderDto.items.map(item => {
        return queryRunner.manager.create(DetallePedido, {
          ...item,
          pedido_id: pedidoGuardado.id,
          subtotal: item.precio_unitario * item.cantidad,
        });
      });

      await queryRunner.manager.save(DetallePedido, detalles);

      // Si todo sale bien, confirmar cambios
      await queryRunner.commitTransaction();
      return this.findOne(pedidoGuardado.id);

    } catch (err) {
      // Si algo falla, revertir todo (Rollback)
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException('No se pudo procesar el pedido. Intente más tarde.');
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
      order: { fecha_creacion: 'DESC' },
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
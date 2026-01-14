import { Controller, Get, Post, Body, Param, UseGuards, ParseUUIDPipe, Delete, UseInterceptors, ClassSerializerInterceptor, NotFoundException, Patch, Req, Logger, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { OrdersService } from '../services/orders.service';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { OrderOwnershipGuard } from '../guards/order-ownership.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
// Cart endpoints have been moved to `CartController` to avoid duplicated logic
import { plainToInstance } from 'class-transformer';
import { OrderResponseDto } from '../dto/responses/order-response.dto';
import { CreateFromCartDto } from '../dto/requests/create-from-cart.dto';
import { HistorialEstado } from '../entities/historial-estado.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Pedido } from '../entities/pedido.entity';
import { DataSource, Repository } from 'typeorm';

@Controller('orders')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class OrdersController {
    private readonly logger = new Logger(OrdersController.name);
    
    constructor(
        // 1. Inyección del servicio de lógica de negocio
        private readonly ordersService: OrdersService,

        // 2. Inyección directa del Repositorio (Si se requiere acceso rápido)
        @InjectRepository(Pedido)
        private readonly pedidoRepo: Repository<Pedido>,

        // 3. Inyección del DataSource (Para transacciones o QueryRunner)
        private readonly dataSource: DataSource,
    ) { }

    @Get()
    @Roles('admin', 'supervisor', 'bodeguero')
    async getAllOrders() {
        return this.ordersService.findAll();
    }

    @Get('/client/:userId')
    @UseGuards(OrderOwnershipGuard)
    @Roles('admin', 'cliente', 'vendedor', 'supervisor')
    async getClientOrders(@Param('userId', ParseUUIDPipe) userId: string) {
        return this.ordersService.findAllByClient(userId);
    }

    @Get('/:id')
    @Roles('admin', 'vendedor', 'cliente', 'bodeguero', 'supervisor')
    async getOrder(@Param('id', ParseUUIDPipe) id: string) {
        // Nota: Aquí se podría añadir un guard extra para validar que el cliente vea solo SU pedido
        return this.ordersService.findOne(id);
    }

    @Get('/:id/detail')
    @Roles('admin', 'vendedor', 'cliente', 'supervisor')
    @UseInterceptors(ClassSerializerInterceptor)
    async getDetail(@Param('id', ParseUUIDPipe) id: string): Promise<OrderResponseDto> {
        const data = await this.ordersService.getOrderDetailProfessional(id);

        // Transformamos la entidad a nuestro contrato profesional de respuesta
        return plainToInstance(OrderResponseDto, data, {
            excludeExtraneousValues: true, // Solo devuelve lo que tiene @Expose()
        });
    }

    @Get('/:id/tracking')
    @Roles('admin', 'cliente', 'vendedor', 'supervisor')
    async getTracking(@Param('id', ParseUUIDPipe) id: string) {
        // Obtenemos el pedido con su historial ordenado por fecha
        const pedido = await this.pedidoRepo.findOne({
            where: { id },
            relations: ['detalles']
        });

        if (!pedido) throw new NotFoundException('Pedido no encontrado');

        // Buscamos el historial detallado
        const historial = await this.dataSource.getRepository(HistorialEstado).find({
            where: { pedido_id: id },
            order: { fecha_cambio: 'ASC' }
        });

        // Respuesta optimizada para UI
        return {
            orderId: pedido.id,
            currentStatus: pedido.estado_actual,
            lastUpdate: pedido.updated_at,
            timeline: historial.map(h => ({
                status: h.estado_nuevo,
                time: h.fecha_cambio,
                message: h.comentario
            }))
        };
    }

    // NOTE: Manual `POST /orders` creation was removed in favor of `POST /orders/from-cart/me` or `POST /orders/from-cart/client/:clienteId`.
    // Orders must be created from cart using the `from-cart` endpoint to ensure server-side
    // price/promotion resolution and snapshot consistency.

    /**
     * POST /orders/from-cart/me
     * Cliente crea pedido desde su propio carrito (usuario_id del JWT, vendedor_id=null)
     */
    @Post('/from-cart/me')
    @Roles('admin', 'cliente', 'vendedor')
    async createFromMyCart(
        @Body() body: CreateFromCartDto,
        @Req() req?: any
    ) {
        const usuarioId = req?.user?.userId || req?.user?.sub || null;
        const role = (req?.user?.role || '').toString().toLowerCase();
        const condicion_pago = body.condicion_pago;
        const sucursal_id = body.sucursal_id;
        // Para carrito propio: usuario_id=<JWT>, vendedor_id=null
        return this.ordersService.createFromCart(usuarioId, usuarioId, role, sucursal_id, condicion_pago, null);
    }

    /**
     * POST /orders/from-cart/client/:clienteId
     * Vendedor crea pedido desde carrito del cliente (resuelve usuario_id desde cliente_id, vendedor_id del JWT)
     */
    @Post('/from-cart/client/:clienteId')
    @UseGuards(OrderOwnershipGuard)
    @Roles('admin', 'vendedor')
    async createFromClientCart(
        @Param('clienteId') clienteId: string,
        @Body() body: CreateFromCartDto,
        @Req() req?: any
    ) {
        const vendedorId = req?.user?.userId || req?.user?.sub || null;
        const role = (req?.user?.role || '').toString().toLowerCase();
        const condicion_pago = body.condicion_pago;
        const sucursal_id = body.sucursal_id;
        // Para carrito de cliente desde vendedor: usuario_id=<cliente_id>, vendedor_id=<JWT>
        return this.ordersService.createFromCart(clienteId, vendedorId, role, sucursal_id, condicion_pago, vendedorId);
    }

    @Get('user/history')
    @Roles('admin', 'vendedor', 'cliente')
    async findMyOrders(@Req() req: any) {
        const userId = req.user?.userId || req.user?.sub;
        const role = req.user?.role;
        return this.ordersService.findAllByUser(userId, role);
    }

    // Cart endpoints moved to `CartController` to avoid duplication.

    /**
     * PATCH /orders/:id/cancel
     *
     * Cancela un pedido cambiando su estado a ANULADO.
     * Solo se puede cancelar si el pedido está en estado PENDIENTE o APROBADO.
     *
     * @param id - UUID del pedido a cancelar
     * @param req - Request con el usuario autenticado
     * @param body.motivo - Motivo de la cancelación (opcional)
     * @returns Pedido actualizado con estado ANULADO
     *
     * Validaciones:
     * - El pedido debe existir
     * - El pedido debe estar en estado PENDIENTE o APROBADO
     * - El usuario debe tener permisos (cliente, vendedor, admin)
     *
     * Roles: admin, cliente, vendedor
     */
    @Patch('/:id/cancel')
    @Roles('admin', 'cliente', 'vendedor')
    async cancelOrder(
        @Param('id', ParseUUIDPipe) id: string,
        @Req() req: any,
        @Body('motivo') motivo?: string,
    ) {
        // Obtener el usuario del JWT
        const usuarioId = req.user?.sub || req.user?.id;
        return this.ordersService.cancelOrder(id, usuarioId, motivo);
    }

    @Patch('/:id/status')
    @Roles('admin', 'supervisor', 'bodeguero')
    async updateStatus(@Param('id', ParseUUIDPipe) id: string, @Body('status') status: string, @Req() req: any) {
        const usuarioId = req.user?.sub || req.user?.id;
        return this.ordersService.updateStatus(id, status, usuarioId);
    }

}


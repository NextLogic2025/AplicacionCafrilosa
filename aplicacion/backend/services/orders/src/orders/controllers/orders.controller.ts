import { Controller, Get, Post, Body, Param, UseGuards, ParseUUIDPipe, Delete, UseInterceptors, ClassSerializerInterceptor, NotFoundException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { OrdersService } from '../services/orders.service';
import { CreateOrderDto } from '../dto/requests/create-order.dto';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { OrderOwnershipGuard } from '../guards/order-ownership.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CartService } from '../services/cart.service';
import { UpdateCartItemDto } from '../dto/requests/update-cart.dto';
import { plainToInstance } from 'class-transformer';
import { OrderResponseDto } from '../dto/responses/order-response.dto';
import { HistorialEstado } from '../entities/historial-estado.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Pedido } from '../entities/pedido.entity';
import { DataSource, Repository } from 'typeorm';

@Controller('orders')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class OrdersController {
    constructor(
        // 1. Inyección del servicio de lógica de negocio
        private readonly ordersService: OrdersService,
        private readonly cartService: CartService,

        // 2. Inyección directa del Repositorio (Si se requiere acceso rápido)
        @InjectRepository(Pedido)
        private readonly pedidoRepo: Repository<Pedido>,

        // 3. Inyección del DataSource (Para transacciones o QueryRunner)
        private readonly dataSource: DataSource,
    ) { }

    @Get('/client/:userId')
    @UseGuards(OrderOwnershipGuard)
    @Roles('admin', 'cliente', 'vendedor')
    async getClientOrders(@Param('userId', ParseUUIDPipe) userId: string) {
        return this.ordersService.findAllByClient(userId);
    }

    @Get('/:id')
    @Roles('admin', 'vendedor', 'cliente', 'bodeguero')
    async getOrder(@Param('id', ParseUUIDPipe) id: string) {
        // Nota: Aquí se podría añadir un guard extra para validar que el cliente vea solo SU pedido
        return this.ordersService.findOne(id);
    }

    @Get('/:id/detail')
    @Roles('admin', 'vendedor', 'cliente')
    @UseInterceptors(ClassSerializerInterceptor)
    async getDetail(@Param('id', ParseUUIDPipe) id: string): Promise<OrderResponseDto> {
        const data = await this.ordersService.getOrderDetailProfessional(id);

        // Transformamos la entidad a nuestro contrato profesional de respuesta
        return plainToInstance(OrderResponseDto, data, {
            excludeExtraneousValues: true, // Solo devuelve lo que tiene @Expose()
        });
    }

    @Get('/:id/tracking')
    @Roles('admin', 'cliente', 'vendedor')
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

    @Post()
    @UseGuards(OrderOwnershipGuard) // Valida que el cliente_id en el DTO sea el del usuario logueado
    @Roles('admin', 'vendedor', 'cliente')
    async createOrder(@Body() createOrderDto: CreateOrderDto) {
        return this.ordersService.create(createOrderDto);
    }

    /**
     * GET /orders/cart/:userId
     *
     * Obtiene el carrito del usuario. Si no existe, lo crea automáticamente (Lazy Creation).
     *
     * @param userId - UUID del usuario
     * @returns CarritoCabecera con sus items
     *
     * Roles: admin, cliente, vendedor
     * Guard: OrderOwnershipGuard valida que el userId coincida con el usuario logueado
     */
    @Get('/cart/:userId')
    @UseGuards(OrderOwnershipGuard)
    @Roles('admin', 'cliente', 'vendedor')
    async getCart(@Param('userId', ParseUUIDPipe) userId: string) {
        return this.cartService.getOrCreateCart(userId);
    }

    /**
     * POST /orders/cart/:userId
     *
     * Agrega o actualiza un producto en el carrito del usuario.
     *
     * Comportamiento Upsert:
     * - Si el producto YA existe en el carrito, actualiza su cantidad
     * - Si el producto NO existe, lo agrega como nuevo item
     *
     * @param userId - UUID del usuario
     * @param dto - UpdateCartItemDto con producto_id, cantidad y precio_unitario_ref (opcional)
     * @returns CarritoItem guardado
     *
     * Validaciones automáticas del DTO:
     * - producto_id: UUID válido
     * - cantidad: Mínimo 0.1 (permite fracciones para venta por peso)
     * - precio_unitario_ref: Opcional, si no se envía se usa 0 por defecto
     *
     * Manejo de errores:
     * - 400 BadRequest: Producto no existe, datos inválidos, UUID malformado
     * - 403 Forbidden: Usuario no autorizado (OrderOwnershipGuard)
     *
     * Roles: admin, cliente, vendedor
     */
    @Post('/cart/:userId')
    @UseGuards(OrderOwnershipGuard)
    @Roles('admin', 'cliente', 'vendedor')
    async addToCart(
        @Param('userId', ParseUUIDPipe) userId: string,
        @Body() dto: UpdateCartItemDto,
    ) {
        return this.cartService.addItem(userId, dto);
    }

    /**
     * DELETE /orders/cart/:userId/item/:productId
     *
     * Elimina un producto específico del carrito del usuario.
     *
     * @param userId - UUID del usuario
     * @param productId - UUID del producto a eliminar
     * @returns void (204 No Content)
     *
     * Manejo de errores:
     * - 404 NotFound: El producto no está en el carrito
     * - 403 Forbidden: Usuario no autorizado (OrderOwnershipGuard)
     *
     * Roles: admin, cliente, vendedor
     */
    @Delete('/cart/:userId/item/:productId')
    @UseGuards(OrderOwnershipGuard)
    @Roles('admin', 'cliente', 'vendedor')
    async removeFromCart(
        @Param('userId', ParseUUIDPipe) userId: string,
        @Param('productId', ParseUUIDPipe) productId: string,
    ) {
        return this.cartService.removeItem(userId, productId);
    }

}


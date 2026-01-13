import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CarritoCabecera } from '../entities/carrito-cabecera.entity';
import { CarritoItem } from '../entities/carrito-item.entity';
import { UpdateCartItemDto } from '../dto/requests/update-cart.dto';

@Injectable()
export class CartService {
    private readonly logger = new Logger(CartService.name);

    constructor(
        @InjectRepository(CarritoCabecera) private readonly cartRepo: Repository<CarritoCabecera>,
        @InjectRepository(CarritoItem) private readonly itemRepo: Repository<CarritoItem>,
    ) { }

    /**
     * Obtiene el carrito del usuario. Si no existe, lo crea (Lazy Creation).
     */
    async getOrCreateCart(usuario_id: string): Promise<CarritoCabecera> {
        let cart = await this.cartRepo.findOne({
            where: { usuario_id },
            relations: ['items'],
        });

        if (!cart) {
            cart = this.cartRepo.create({ usuario_id });
            cart = await this.cartRepo.save(cart);
            cart.items = [];
        }
        return cart;
    }

    /**
     * Lógica de Upsert: Si el producto existe en el carrito, actualiza cantidad;
     * de lo contrario, agrega uno nuevo.
     *
     * Manejo de errores:
     * - BadRequestException: Si el producto_id no existe (foreign key violation)
     * - BadRequestException: Si hay datos inválidos
     * - Error genérico: Para otros errores inesperados
     */
    async addItem(usuario_id: string, dto: UpdateCartItemDto): Promise<CarritoItem> {
        try {
            this.logger.log(`Usuario ${usuario_id} agregando producto ${dto.producto_id}`);

            const cart = await this.getOrCreateCart(usuario_id);

            let item = await this.itemRepo.findOne({
                where: { carrito_id: cart.id, producto_id: dto.producto_id },
            });

            if (item) {
                item.cantidad = dto.cantidad;
                if (dto.precio_unitario_ref !== undefined) {
                    item.precio_unitario_ref = dto.precio_unitario_ref;
                }
            } else {
                item = this.itemRepo.create({
                    carrito_id: cart.id,
                    producto_id: dto.producto_id,
                    cantidad: dto.cantidad,
                    precio_unitario_ref: dto.precio_unitario_ref ?? 0,
                });
            }

            const savedItem = await this.itemRepo.save(item);
            await this.recalculateTotals(cart.id);

            return savedItem;

        } catch (error) {
            this.logger.error(`Error al agregar item al carrito: ${error.message}`, error.stack);

            // Detectar errores específicos de base de datos
            if (error.code === '23503') {
                // Foreign key violation - producto no existe
                throw new BadRequestException(
                    `El producto con ID ${dto.producto_id} no existe o no está disponible`
                );
            }

            if (error.code === '23505') {
                // Unique constraint violation (aunque no debería pasar con nuestro findOne)
                throw new BadRequestException(
                    `El producto ya está en el carrito. Use la operación de actualización.`
                );
            }

            if (error.code === '22P02') {
                // Invalid UUID format
                throw new BadRequestException(
                    `El formato del producto_id no es válido`
                );
            }

            // Si es una excepción de NestJS, re-lanzarla
            if (error instanceof BadRequestException || error instanceof NotFoundException) {
                throw error;
            }

            // Error genérico
            throw new BadRequestException(
                `No se pudo agregar el producto al carrito: ${error.message}`
            );
        }
    }

    async removeItem(usuario_id: string, producto_id: string): Promise<{ success: boolean }> {
        const cart = await this.getOrCreateCart(usuario_id);
        const result = await this.itemRepo.delete({ carrito_id: cart.id, producto_id });

        if (result.affected === 0) {
            throw new NotFoundException('El producto no se encuentra en el carrito');
        }

        await this.recalculateTotals(cart.id);
        return { success: true };
    }

    async clearCart(usuario_id: string): Promise<void> {
        const cart = await this.getOrCreateCart(usuario_id);
        await this.itemRepo.delete({ carrito_id: cart.id });
        
        // Resetear total a 0
        cart.total_estimado = 0;
        await this.cartRepo.save(cart);
    }

    /**
     * Actualiza el cliente_id asociado al carrito
     * Útil cuando un vendedor selecciona un cliente
     */
    async setClienteId(usuario_id: string, cliente_id: string): Promise<CarritoCabecera> {
        this.logger.log(`Actualizando cliente_id=${cliente_id} para usuario=${usuario_id}`);
        const cart = await this.getOrCreateCart(usuario_id);
        cart.cliente_id = cliente_id;
        const saved = await this.cartRepo.save(cart);
        this.logger.log(`Cliente guardado en carrito ${cart.id}`);
        return saved;
    }

    /**
     * Recalcula el total_estimado del carrito basado en sus items
     */
    async recalculateTotals(carrito_id: string): Promise<void> {
        const items = await this.itemRepo.find({ where: { carrito_id } });
        
        const total_estimado = items.reduce((acc, item) => {
            return acc + (Number(item.cantidad) * Number(item.precio_unitario_ref || 0));
        }, 0);

        await this.cartRepo.update(carrito_id, { total_estimado });
    }
}
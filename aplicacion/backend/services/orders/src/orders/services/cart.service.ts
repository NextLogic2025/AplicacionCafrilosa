import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CarritoCabecera } from '../entities/carrito-cabecera.entity';
import { CarritoItem } from '../entities/carrito-item.entity';
import { UpdateCartItemDto } from '../dto/requests/update-cart.dto';

@Injectable()
export class CartService {
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
     */
    async addItem(usuario_id: string, dto: UpdateCartItemDto): Promise<CarritoItem> {
        const cart = await this.getOrCreateCart(usuario_id);

        let item = await this.itemRepo.findOne({
            where: { carrito_id: cart.id, producto_id: dto.producto_id },
        });

        if (item) {
            // En un flujo profesional, decidimos si sumamos o reemplazamos. 
            // Aquí reemplazamos por el valor del DTO para mayor control desde el UI.
            item.cantidad = dto.cantidad;
            if (dto.precio_unitario_ref) item.precio_unitario_ref = dto.precio_unitario_ref;
        } else {
            item = this.itemRepo.create({
                ...dto,
                carrito_id: cart.id,
            });
        }

        return this.itemRepo.save(item);
    }

    async removeItem(usuario_id: string, producto_id: string): Promise<void> {
        const cart = await this.getOrCreateCart(usuario_id);
        const result = await this.itemRepo.delete({ carrito_id: cart.id, producto_id });

        if (result.affected === 0) {
            throw new NotFoundException('El producto no se encuentra en el carrito');
        }
    }

    async clearCart(usuario_id: string): Promise<void> {
        const cart = await this.getOrCreateCart(usuario_id);
        await this.itemRepo.delete({ carrito_id: cart.id });
    }
}
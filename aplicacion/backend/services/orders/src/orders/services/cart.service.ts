import { Injectable, NotFoundException, Logger, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CarritoCabecera } from '../entities/carrito-cabecera.entity';
import { CarritoItem } from '../entities/carrito-item.entity';
import { UpdateCartItemDto } from '../dto/requests/update-cart.dto';
import axios from 'axios';

const DEFAULT_CATALOG_URL = process.env.CATALOG_SERVICE_URL || 'http://catalog-service:3003';

@Injectable()
export class CartService {
    constructor(
        @InjectRepository(CarritoCabecera) private readonly cartRepo: Repository<CarritoCabecera>,
        @InjectRepository(CarritoItem) private readonly itemRepo: Repository<CarritoItem>,
    ) { }

        async resolveClientIdentity(user: any, dto: UpdateCartItemDto): Promise<{ clienteId: string | null; vendedorId: string }> {
            const rawRole = user?.role;
            const roles = Array.isArray(rawRole) ? rawRole.map((r: any) => String(r).toLowerCase()) : [String(rawRole || '').toLowerCase()];
            let clienteId = (dto as any).cliente_id ?? null;
            const vendedorId = user?.userId ?? user?.id ?? null;

            if (!vendedorId) throw new BadRequestException('Usuario no identificado');

            // Cliente self-service: override clienteId with catalog lookup
            if (roles.includes('cliente')) {
                try {
                    const url = `${DEFAULT_CATALOG_URL}/internal/clients/by-user/${vendedorId}`;
                    const resp = await axios.get(url);
                    const data = resp.data || null;
                    if (!data || !data.id) throw new Error('No cliente asociado');
                    clienteId = data.id;
                } catch (err) {
                    throw new ForbiddenException('No se pudo verificar identidad de cliente en catálogo');
                }
            } else if (roles.includes('vendedor')) {
                if (!clienteId) throw new BadRequestException('El vendedor debe especificar cliente_id en el body');
            }

            return { clienteId, vendedorId };
        }

        // New polymorphic entry for adding item using token identity
        async addItemForUser(user: any, dto: UpdateCartItemDto): Promise<CarritoItem> {
            const { clienteId, vendedorId } = await this.resolveClientIdentity(user, dto);
            // Reuse existing logic but operate on resolved IDs
            const cart = await this.getOrCreateCart(vendedorId, clienteId);

            if (!dto.precio_unitario_ref) {
                try {
                    const clientQuery = clienteId ? `?cliente_id=${clienteId}` : '';
                    const url = `${DEFAULT_CATALOG_URL}/products/${dto.producto_id}${clientQuery}`;
                    const resp = await axios.get(url);
                    const prod = resp.data || {};
                    const suggested = prod.precio_oferta ?? prod.precio_original ?? null;
                    if (suggested != null) dto.precio_unitario_ref = Number(suggested);
                } catch (err) {
                    Logger.warn('Failed to fetch referential price from catalog: ' + (err as any).message);
                }
            }

            let item = await this.itemRepo.findOne({ where: { carrito_id: cart.id, producto_id: dto.producto_id } });

            if (item) {
                item.cantidad = dto.cantidad;
                if (dto.precio_unitario_ref) item.precio_unitario_ref = dto.precio_unitario_ref;
            } else {
                item = this.itemRepo.create({ ...dto, carrito_id: cart.id });
            }

            return this.itemRepo.save(item);
        }

    /**
     * Obtiene el carrito del usuario. Si no existe, lo crea (Lazy Creation).
     */
    async getOrCreateCart(usuario_id: string, cliente_id?: string | null): Promise<CarritoCabecera> {
        const where: any = { usuario_id };
        if (cliente_id) where.cliente_id = cliente_id;

        let cart = await this.cartRepo.findOne({ where, relations: ['items'] });

        if (!cart) {
            cart = this.cartRepo.create({ usuario_id, cliente_id: cliente_id ?? null });
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
        // Determine cliente context: if DTO contains cliente_id (vendedor on behalf), use it
        const clienteId = dto.cliente_id ?? null;

        const cart = await this.getOrCreateCart(usuario_id, clienteId);

        // If no precio_unitario_ref provided, try to fetch a referential price from catalog
        if (!dto.precio_unitario_ref) {
                try {
                    const clientQuery = clienteId ? `?cliente_id=${clienteId}` : '';
                    const url = `${DEFAULT_CATALOG_URL}/products/${dto.producto_id}${clientQuery}`;
                    const resp = await axios.get(url);
                    const prod = resp.data || {};
                const suggested = prod.precio_oferta ?? prod.precio_original ?? null;
                if (suggested != null) dto.precio_unitario_ref = Number(suggested);
            } catch (err) {
                // don't block the operation if catalog is down; just proceed without ref price
                Logger.warn('Failed to fetch referential price from catalog: ' + (err as any).message);
            }
        }

        let item = await this.itemRepo.findOne({ where: { carrito_id: cart.id, producto_id: dto.producto_id } });

        if (item) {
            item.cantidad = dto.cantidad;
            if (dto.precio_unitario_ref) item.precio_unitario_ref = dto.precio_unitario_ref;
        } else {
            item = this.itemRepo.create({ ...dto, carrito_id: cart.id });
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
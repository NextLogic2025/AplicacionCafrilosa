import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { CarritoCabecera } from '../entities/carrito-cabecera.entity';
import { CarritoItem } from '../entities/carrito-item.entity';
import { UpdateCartItemDto } from '../dto/requests/update-cart.dto';
import { ServiceHttpClient } from '../../common/http/service-http-client.service';

@Injectable()
export class CartService {
    private readonly logger = new Logger(CartService.name);

    constructor(
        @InjectRepository(CarritoCabecera) private readonly cartRepo: Repository<CarritoCabecera>,
        @InjectRepository(CarritoItem) private readonly itemRepo: Repository<CarritoItem>,
        private readonly serviceHttp: ServiceHttpClient,
    ) { }

    /**
     * Obtiene el carrito del usuario. Si no existe, lo crea (Lazy Creation).
     * Solo obtiene carritos activos (deleted_at IS NULL)
     * @param usuario_id - UUID del usuario propietario del carrito
     * @param vendedor_id - UUID del vendedor (opcional). Si se proporciona, busca carrito del vendedor. Si no, carrito del cliente.
     */
    async getOrCreateCart(usuario_id: string, vendedor_id?: string): Promise<any> {
        const originalParamId = usuario_id;
        let resolvedUsuarioId = usuario_id;
        let resolvedClienteId: string | null = null;

        // Si es vendedor, intentar resolver cliente desde Catalog usando el id del path (que puede ser cliente_id)
        if (vendedor_id) {
            try {
                const body = await this.serviceHttp.get<any>(
                    'catalog-service',
                    `/internal/clients/${originalParamId}`,
                );
                resolvedClienteId = body?.id ?? null;
                resolvedUsuarioId = body?.usuario_principal_id ?? resolvedUsuarioId;
                this.logger.debug('Resolved client for vendor cart', { originalParamId, cliente_id: resolvedClienteId, usuario_principal_id: resolvedUsuarioId, vendedor_id });
            } catch (err) {
                this.logger.debug('No se pudo resolver cliente desde Catalog (vendor path)', { originalParamId, vendedor_id, err: err?.message || String(err) });
            }
        }

        this.logger.debug('Cart lookup input', { originalParamId, resolvedUsuarioId, resolvedClienteId, vendedor_id });

        const whereCondition: any = {
            usuario_id: resolvedUsuarioId,
            deleted_at: IsNull()
        };

        if (vendedor_id) {
            whereCondition['vendedor_id'] = vendedor_id;
        } else {
            whereCondition['vendedor_id'] = IsNull();
        }

        let cart = await this.cartRepo.findOne({
            where: whereCondition,
            relations: ['items'],
        });

        if (!cart) {
            cart = this.cartRepo.create({
                usuario_id: resolvedUsuarioId,
                vendedor_id: vendedor_id || null,
                total_estimado: 0,
                cliente_id: resolvedClienteId,
            });
            cart = await this.cartRepo.save(cart);
            cart.items = [];
            this.logger.debug('Created cart', { cartId: cart.id, usuario_id: resolvedUsuarioId, vendedor_id: vendedor_id || null, cliente_id: resolvedClienteId || null, source: 'create' });

            // Resolver cliente_id
            try {
                const body = await this.serviceHttp.get<any>(
                    'catalog-service',
                    `/internal/clients/by-user/${resolvedUsuarioId}`,
                );
                if (body && body.id) {
                    cart.cliente_id = body.id;
                    await this.cartRepo.save(cart);
                    this.logger.debug('Asignado cliente_id=' + body.id + ' al carrito ' + cart.id + ' (by-user)');
                }

                if (!cart.cliente_id && vendedor_id) {
                    cart.cliente_id = originalParamId;
                    await this.cartRepo.save(cart);
                    this.logger.debug('Asignado cliente_id (fallback path)=' + originalParamId + ' al carrito ' + cart.id);
                }
            } catch (err) {
                this.logger.debug('No se pudo resolver cliente_id desde Catalog al crear carrito', { usuario_id: resolvedUsuarioId, err: err?.message || String(err) });
                if (vendedor_id && !cart.cliente_id) {
                    cart.cliente_id = originalParamId;
                    await this.cartRepo.save(cart);
                }
            }
        } else {
            this.logger.debug('Found existing cart', { cartId: cart.id, usuario_id: resolvedUsuarioId, vendedor_id: vendedor_id || null, cliente_id: cart.cliente_id });
            if (vendedor_id && !cart.cliente_id) {
                try {
                    const body = await this.serviceHttp.get<any>(
                        'catalog-service',
                        `/internal/clients/by-user/${resolvedUsuarioId}`,
                    );
                    if (body && body.id) {
                        cart.cliente_id = body.id;
                        await this.cartRepo.save(cart);
                        this.logger.debug('Asignado cliente_id=' + body.id + ' al carrito ' + cart.id + ' (by-user, existing)');
                    }
                } catch (err) {
                    this.logger.debug('No se pudo resolver cliente_id en carrito vendedor existente', { usuario_id, err: err?.message || String(err) });
                }

                if (!cart.cliente_id) {
                    cart.cliente_id = originalParamId;
                    await this.cartRepo.save(cart);
                    this.logger.debug('Asignado cliente_id (fallback path)=' + originalParamId + ' al carrito ' + cart.id + ' (existing)');
                }
            }

            await this.recalculateTotals(cart.id);
            cart = await this.cartRepo.findOne({
                where: { id: cart.id },
                relations: ['items'],
            });

            // Validar promociones/precios con el servicio Catalog (batch)
            const removed_items: Array<any> = [];
            if (cart.items && cart.items.length) {
                try {
                    const ids = cart.items.map((it: any) => it.producto_id);
                    const data = await this.serviceHttp.post<any[]>(
                        'catalog-service',
                        '/products/internal/batch',
                        { ids, cliente_id: cart.cliente_id ?? undefined },
                    );

                    const map = new Map<string, any>();
                    (data || []).forEach((p: any) => map.set(String(p.id), p));

                    for (const item of cart.items) {
                        const prod = map.get(String(item.producto_id));
                        const appliedCampaign = prod?.promocion?.campania_id ?? null;

                        if (item.campania_aplicada_id && !appliedCampaign) {
                            await this.itemRepo.delete({ id: item.id });
                            removed_items.push({ producto_id: item.producto_id, campania_aplicada_id: item.campania_aplicada_id });
                        } else if (item.campania_aplicada_id && appliedCampaign && String(appliedCampaign) !== String(item.campania_aplicada_id)) {
                            await this.itemRepo.delete({ id: item.id });
                            removed_items.push({ producto_id: item.producto_id, campania_aplicada_id: item.campania_aplicada_id, expected_campaign: appliedCampaign });
                        }
                    }

                    if (removed_items.length) {
                        await this.recalculateTotals(cart.id);
                        cart = await this.cartRepo.findOne({ where: { id: cart.id }, relations: ['items'] });
                        (cart as any).removed_items = removed_items;
                    }
                } catch (err) {
                    this.logger.warn('Error consultando Catalog batch al validar carrito', { cartId: cart.id, err: err?.message || err });
                    (cart as any).warnings = (cart as any).warnings || [];
                    (cart as any).warnings.push({ issue: 'catalog_batch_error', message: err?.message || String(err) });
                }
            }
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
    async addItem(usuario_id: string, dto: UpdateCartItemDto, vendedor_id?: string): Promise<CarritoItem> {
        try {
            this.logger.debug(`Usuario ${usuario_id} agregando producto ${dto.producto_id} (vendedor_id=${vendedor_id || 'null'})`);

            const cart = await this.getOrCreateCart(usuario_id, vendedor_id);

            let item = await this.itemRepo.findOne({
                where: { carrito_id: cart.id, producto_id: dto.producto_id },
            });

            if (item) {
                item.cantidad = dto.cantidad;
                if (dto.campania_aplicada_id !== undefined) {
                    item.campania_aplicada_id = dto.campania_aplicada_id;
                }
                if (dto.motivo_descuento !== undefined) {
                    item.motivo_descuento = dto.motivo_descuento;
                }
            } else {
                // Intentar obtener mejor promocion/precio desde Catalog y sobrescribir valores del cliente
                let precioUnitarioRef = 0;
                let precioOriginalSnapshot = null;
                let campaniaAplicada = dto.campania_aplicada_id ?? null;

                try {
                    const arr = await this.serviceHttp.post<any[]>(
                        'catalog-service',
                        '/products/internal/batch',
                        { ids: [dto.producto_id], cliente_id: cart.cliente_id ?? undefined },
                    );
                    const best = Array.isArray(arr) && arr.length ? arr[0] : null;
                    if (best) {
                        if (best.promocion?.precio_final != null) {
                            precioUnitarioRef = Number(best.promocion.precio_final);
                            precioOriginalSnapshot = best.promocion.precio_lista ?? precioOriginalSnapshot;
                            campaniaAplicada = best.promocion.campania_id ?? campaniaAplicada;
                            dto.motivo_descuento = dto.motivo_descuento ?? (best.promocion.campania_nombre ?? null);
                            (cart as any).warnings = (cart as any).warnings || [];
                            (cart as any).warnings.push({ producto_id: dto.producto_id, action: 'precio_sobrescrito', precio_final: precioUnitarioRef });
                        } else {
                            let chosenPrice: number | null = null;
                            try {
                                if (cart.cliente_id) {
                                    const clientBody = await this.serviceHttp.get<any>(
                                        'catalog-service',
                                        `/internal/clients/${cart.cliente_id}`,
                                    );
                                    const listaId = clientBody?.lista_precios_id ?? null;
                                    if (listaId && Array.isArray(best.precios) && best.precios.length) {
                                        const match = best.precios.find((p: any) => Number(p.lista_id) === Number(listaId));
                                        if (match) chosenPrice = Number(match.precio);
                                    }
                                }
                            } catch (err) {
                                this.logger.debug('No se pudo resolver lista del cliente para precio', { err: err?.message || String(err) });
                            }

                            if (chosenPrice == null && Array.isArray(best.precios) && best.precios.length) {
                                chosenPrice = Math.min(...best.precios.map((p: any) => Number(p.precio || 0)));
                            }

                            if (chosenPrice != null) {
                                precioUnitarioRef = Number(chosenPrice);
                                precioOriginalSnapshot = precioUnitarioRef;
                            }
                        }
                    }
                } catch (err) {
                    this.logger.warn('No se pudo consultar Catalog al agregar item, usando valores del cliente', err?.message || err);
                }

                item = this.itemRepo.create({
                    carrito_id: cart.id,
                    producto_id: dto.producto_id,
                    cantidad: dto.cantidad,
                    precio_unitario_ref: precioUnitarioRef,
                    precio_original_snapshot: precioOriginalSnapshot,
                    campania_aplicada_id: campaniaAplicada,
                    motivo_descuento: dto.motivo_descuento ?? null,
                });
            }

            const savedItem = await this.itemRepo.save(item);
            await this.recalculateTotals(cart.id);

            return savedItem;

        } catch (error) {
            this.logger.error(`Error al agregar item al carrito: ${error.message}`, error.stack);

            if (error.code === '23503') {
                throw new BadRequestException(
                    `El producto con ID ${dto.producto_id} no existe o no esta disponible`
                );
            }

            if (error.code === '23505') {
                throw new BadRequestException(
                    `El producto ya esta en el carrito. Use la operacion de actualizacion.`
                );
            }

            if (error.code === '22P02') {
                throw new BadRequestException(
                    `El formato del producto_id no es valido`
                );
            }

            if (error instanceof BadRequestException || error instanceof NotFoundException) {
                throw error;
            }

            throw new BadRequestException(
                `No se pudo agregar el producto al carrito: ${error.message}`
            );
        }
    }

    async removeItem(usuario_id: string, producto_id: string, vendedor_id?: string): Promise<{ success: boolean }> {
        this.logger.debug(`Eliminando producto ${producto_id} del carrito del usuario ${usuario_id} (vendedor_id=${vendedor_id || 'null'})`);

        const whereCondition: any = {
            usuario_id,
            deleted_at: IsNull()
        };

        if (vendedor_id) {
            whereCondition['vendedor_id'] = vendedor_id;
        } else {
            whereCondition['vendedor_id'] = IsNull();
        }

        const cart = await this.cartRepo.findOne({
            where: whereCondition,
        });

        if (!cart) {
            this.logger.warn(`No se encontró carrito para usuario ${usuario_id}`);
            throw new NotFoundException('Carrito no encontrado');
        }

        const result = await this.itemRepo.delete({ carrito_id: cart.id, producto_id });
        this.logger.debug(`Resultado de eliminación: ${result.affected} items eliminados`);

        if (result.affected === 0) {
            throw new NotFoundException('El producto no se encuentra en el carrito');
        }

        await this.recalculateTotals(cart.id);
        return { success: true };
    }

    async clearCart(usuario_id: string, vendedor_id?: string): Promise<void> {
        this.logger.debug(`Vaciando carrito del usuario ${usuario_id} (vendedor: ${vendedor_id || 'cliente'})`);

        const whereCondition: any = {
            usuario_id,
            deleted_at: IsNull()
        };

        if (vendedor_id) {
            whereCondition['vendedor_id'] = vendedor_id;
        } else {
            whereCondition['vendedor_id'] = IsNull();
        }

        const cart = await this.cartRepo.findOne({
            where: whereCondition,
        });

        if (!cart) {
            this.logger.warn(`No se encontró carrito para usuario ${usuario_id} vendedor ${vendedor_id || 'cliente'}`);
            return; // No hay carrito que vaciar
        }

        const deleteResult = await this.itemRepo.delete({ carrito_id: cart.id });
        this.logger.debug(`Carrito vaciado: ${deleteResult.affected} items eliminados`);

        // Resetear total a 0
        cart.total_estimado = 0;
        await this.cartRepo.save(cart);
    }

    async clearCartById(carrito_id: string): Promise<void> {
        this.logger.debug(`Vaciando carrito por ID: ${carrito_id}`);

        const cart = await this.cartRepo.findOne({
            where: { id: carrito_id, deleted_at: IsNull() },
        });

        if (!cart) {
            this.logger.warn(`No se encontró carrito con ID ${carrito_id}`);
            return;
        }

        const deleteResult = await this.itemRepo.delete({ carrito_id: cart.id });
        this.logger.debug(`Carrito ${carrito_id} vaciado: ${deleteResult.affected} items eliminados`);

        // Resetear total a 0
        cart.total_estimado = 0;
        await this.cartRepo.save(cart);
    }

    /**
     * Actualiza el cliente_id asociado al carrito
     * Útil cuando un vendedor selecciona un cliente
     */
    async setClienteId(usuario_id: string, cliente_id: string, vendedor_id?: string): Promise<CarritoCabecera> {
        this.logger.debug(`Actualizando cliente_id=${cliente_id} para usuario=${usuario_id} (vendedor_id=${vendedor_id || 'null'})`);
        const cart = await this.getOrCreateCart(usuario_id, vendedor_id);
        cart.cliente_id = cliente_id;
        const saved = await this.cartRepo.save(cart);
        this.logger.debug(`Cliente guardado en carrito ${cart.id}`);
        return saved;
    }

    /**
     * Recalcula el total_estimado del carrito basado en sus items
     * Se ejecuta después de cualquier modificación de items
     */
    async recalculateTotals(carrito_id: string): Promise<number> {
        const items = await this.itemRepo.find({ where: { carrito_id } });

        const total_estimado = items.reduce((acc, item) => {
            const cantidad = Number(item.cantidad) || 0;
            const precio = Number(item.precio_unitario_ref) || 0;
            return acc + (cantidad * precio);
        }, 0);

        this.logger.debug(`Recalculando totales para carrito ${carrito_id}: ${items.length} items, total=${total_estimado}`);

        await this.cartRepo.update(carrito_id, { total_estimado });
        return total_estimado;
    }
}





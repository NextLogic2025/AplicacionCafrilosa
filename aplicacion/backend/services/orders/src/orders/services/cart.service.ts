import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { CarritoCabecera } from '../entities/carrito-cabecera.entity';
import { CarritoItem } from '../entities/carrito-item.entity';
import { UpdateCartItemDto } from '../dto/requests/update-cart.dto';

@Injectable()
export class CartService {
    private readonly logger = new Logger(CartService.name);

    constructor(
        @InjectRepository(CarritoCabecera) private readonly cartRepo: Repository<CarritoCabecera>,
        @InjectRepository(CarritoItem) private readonly itemRepo: Repository<CarritoItem>,
        private readonly configService: ConfigService,
    ) { }

    /**
     * Obtiene el carrito del usuario. Si no existe, lo crea (Lazy Creation).
     * Solo obtiene carritos activos (deleted_at IS NULL)
     * @param usuario_id - UUID del usuario propietario del carrito
     * @param vendedor_id - UUID del vendedor (opcional). Si se proporciona, busca carrito del vendedor. Si no, carrito del cliente.
     */
    async getOrCreateCart(usuario_id: string, vendedor_id?: string): Promise<any> {
        const originalParamId = usuario_id; // Puede venir como usuario_id (cliente) o como cliente_id si lo envía un vendedor
        let resolvedUsuarioId = usuario_id;
        let resolvedClienteId: string | null = null;

        // Si es vendedor, intentar resolver cliente desde Catalog usando el id del path (que puede ser cliente_id)
        if (vendedor_id) {
            try {
                const base = this.configService.get<string>('CATALOG_SERVICE_URL') || process.env.CATALOG_SERVICE_URL || 'http://catalog-service:3000';
                const serviceToken = this.configService.get<string>('SERVICE_TOKEN') || process.env.SERVICE_TOKEN;
                const fetchFn = (globalThis as any).fetch;
                if (typeof fetchFn === 'function') {
                    const apiBase = base.replace(/\/+$/, '') + (base.includes('/api') ? '' : '/api');
                    const url = apiBase + '/internal/clients/' + originalParamId;
                    const resp: any = await fetchFn(url, { headers: serviceToken ? { Authorization: 'Bearer ' + serviceToken } : {} });
                    if (resp && resp.ok) {
                        const body = await resp.json();
                        resolvedClienteId = body?.id ?? null;
                        resolvedUsuarioId = body?.usuario_principal_id ?? resolvedUsuarioId;
                        this.logger.debug('Resolved client for vendor cart', { originalParamId, cliente_id: resolvedClienteId, usuario_principal_id: resolvedUsuarioId, vendedor_id });
                    }
                }
            } catch (err) {
                this.logger.debug('No se pudo resolver cliente desde Catalog (vendor path)', { originalParamId, vendedor_id, err: err?.message || String(err) });
            }
        }

        this.logger.debug('Cart lookup input', { originalParamId, resolvedUsuarioId, resolvedClienteId, vendedor_id });

        // Build where condition to handle null vendedor_id correctly with TypeORM IsNull()
        const whereCondition: any = {
            usuario_id: resolvedUsuarioId,
            deleted_at: IsNull()  // Solo carritos activos (no soft-deleted)
        };
        
        if (vendedor_id) {
            // Vendor cart: search for specific vendedor_id
            whereCondition['vendedor_id'] = vendedor_id;
        } else {
            // Client cart: search for IS NULL vendedor_id
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

            const base = this.configService.get<string>('CATALOG_SERVICE_URL') || process.env.CATALOG_SERVICE_URL || 'http://catalog-service:3000';
            const serviceToken = this.configService.get<string>('SERVICE_TOKEN') || process.env.SERVICE_TOKEN;
            const fetchFn = (globalThis as any).fetch;

            // Resolver cliente_id
            if (typeof fetchFn === 'function') {
                try {
                    const apiBase = base.replace(/\/+$/, '') + (base.includes('/api') ? '' : '/api');
                    // 1) Intentar por usuario (cubre flujo cliente y vendedor si ya teníamos usuario_id resuelto)
                    const urlByUser = apiBase + '/internal/clients/by-user/' + resolvedUsuarioId;
                    const respUser: any = await fetchFn(urlByUser, { headers: serviceToken ? { Authorization: 'Bearer ' + serviceToken } : {} });
                    if (respUser && respUser.ok) {
                        const body = await respUser.json();
                        if (body && body.id) {
                            cart.cliente_id = body.id;
                            await this.cartRepo.save(cart);
                            this.logger.debug('Asignado cliente_id=' + body.id + ' al carrito ' + cart.id + ' (by-user)');
                        }
                    }

                    // 2) Si sigue null y es flujo vendedor, usar el id del path (cliente_id) como fallback
                    if (!cart.cliente_id && vendedor_id) {
                        cart.cliente_id = originalParamId;
                        await this.cartRepo.save(cart);
                        this.logger.debug('Asignado cliente_id (fallback path)=' + originalParamId + ' al carrito ' + cart.id);
                    }
                } catch (err) {
                    this.logger.debug('No se pudo resolver cliente_id desde Catalog al crear carrito', { usuario_id: resolvedUsuarioId, err: err?.message || String(err) });
                    // Fallback: si es carrito de vendedor y no tenemos cliente_id, usar el path
                    if (vendedor_id && !cart.cliente_id) {
                        cart.cliente_id = originalParamId;
                        await this.cartRepo.save(cart);
                    }
                }
            } else {
                // Fallback: si no hay fetch, asignar path como cliente_id en carrito de vendedor
                if (vendedor_id) {
                    cart.cliente_id = originalParamId;
                    await this.cartRepo.save(cart);
                }
            }
        } else {
            this.logger.debug('Found existing cart', { cartId: cart.id, usuario_id: resolvedUsuarioId, vendedor_id: vendedor_id || null, cliente_id: cart.cliente_id });
            // Si es carrito de vendedor y no tiene cliente_id, intentar resolverlo y luego fallback al path
            if (vendedor_id && !cart.cliente_id) {
                try {
                    const base = this.configService.get<string>('CATALOG_SERVICE_URL') || process.env.CATALOG_SERVICE_URL || 'http://catalog-service:3000';
                    const serviceToken = this.configService.get<string>('SERVICE_TOKEN') || process.env.SERVICE_TOKEN;
                    const fetchFn = (globalThis as any).fetch;
                    if (typeof fetchFn === 'function') {
                        const apiBase = base.replace(/\/+$/, '') + (base.includes('/api') ? '' : '/api');
                        const urlByUser = apiBase + '/internal/clients/by-user/' + resolvedUsuarioId;
                        const respUser: any = await fetchFn(urlByUser, { headers: serviceToken ? { Authorization: 'Bearer ' + serviceToken } : {} });
                        if (respUser && respUser.ok) {
                            const body = await respUser.json();
                            if (body && body.id) {
                                cart.cliente_id = body.id;
                                await this.cartRepo.save(cart);
                                this.logger.debug('Asignado cliente_id=' + body.id + ' al carrito ' + cart.id + ' (by-user, existing)');
                            }
                        }
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

            // Recalcular totales al cargar el carrito para asegurar consistencia
            await this.recalculateTotals(cart.id);
            // Recargar el carrito con el total actualizado
            cart = await this.cartRepo.findOne({
                where: { id: cart.id },
                relations: ['items'],
            });

            // Validar promociones/ precios con el servicio Catalog (batch)
            const base = this.configService.get<string>('CATALOG_SERVICE_URL') || process.env.CATALOG_SERVICE_URL || 'http://catalog-service:3000';
            const serviceToken = this.configService.get<string>('SERVICE_TOKEN') || process.env.SERVICE_TOKEN;
            const fetchFn = (globalThis as any).fetch;
            const removed_items: Array<any> = [];

            if (typeof fetchFn === 'function' && cart.items && cart.items.length) {
                try {
                    const ids = cart.items.map((it: any) => it.producto_id);
                    const apiBase = base.replace(/\/+$/, '') + (base.includes('/api') ? '' : '/api');
                    const url = apiBase + '/products/internal/batch';
                    const resp: any = await fetchFn(url, {
                        method: 'POST',
                        headers: Object.assign({ 'Content-Type': 'application/json' }, serviceToken ? { Authorization: 'Bearer ' + serviceToken } : {}),
                        body: JSON.stringify({ ids, cliente_id: cart.cliente_id ?? undefined }),
                    });

                    if (!resp || !resp.ok) {
                        this.logger.debug('No se obtuvo respuesta batch de Catalog para carrito', { cartId: cart.id });
                        (cart as any).warnings = (cart as any).warnings || [];
                        (cart as any).warnings.push({ issue: 'catalog_batch_unavailable' });
                    } else {
                        const data = await resp.json();
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
                // Intentar obtener mejor promoción/precio desde Catalog y sobrescribir valores del cliente
                const base = this.configService.get<string>('CATALOG_SERVICE_URL') || process.env.CATALOG_SERVICE_URL || 'http://catalog-service:3000';
                const serviceToken = this.configService.get<string>('SERVICE_TOKEN') || process.env.SERVICE_TOKEN;
                const fetchFn = (globalThis as any).fetch;

                let precioUnitarioRef = 0;
                let precioOriginalSnapshot = null;
                let campaniaAplicada = dto.campania_aplicada_id ?? null;

                try {
                    if (typeof fetchFn === 'function') {
                        const apiBase = base.replace(/\/+$/, '') + (base.includes('/api') ? '' : '/api');
                        const url = `${apiBase}/products/internal/batch`;
                        const resp: any = await fetchFn(url, {
                            method: 'POST',
                            headers: Object.assign({ 'Content-Type': 'application/json' }, serviceToken ? { Authorization: `Bearer ${serviceToken}` } : {}),
                            body: JSON.stringify({ ids: [dto.producto_id], cliente_id: cart.cliente_id ?? undefined }),
                        });
                                if (resp && resp.ok) {
                                    const arr = await resp.json();
                                    const best = Array.isArray(arr) && arr.length ? arr[0] : null;
                                    if (best) {
                                        // Si hay promoción aplicada, usarla y setear motivo con el nombre
                                        if (best.promocion?.precio_final != null) {
                                            precioUnitarioRef = Number(best.promocion.precio_final);
                                            precioOriginalSnapshot = best.promocion.precio_lista ?? precioOriginalSnapshot;
                                            campaniaAplicada = best.promocion.campania_id ?? campaniaAplicada;
                                            dto.motivo_descuento = dto.motivo_descuento ?? (best.promocion.campania_nombre ?? null);
                                            (cart as any).warnings = (cart as any).warnings || [];
                                            (cart as any).warnings.push({ producto_id: dto.producto_id, action: 'precio_sobrescrito', precio_final: precioUnitarioRef });
                                        } else {
                                            // No hay promoción: intentar elegir precio de la lista del cliente
                                            let chosenPrice: number | null = null;
                                            try {
                                                if (cart.cliente_id) {
                                                    // Resolver lista de precios del cliente
                                                    const baseCli = this.configService.get<string>('CATALOG_SERVICE_URL') || process.env.CATALOG_SERVICE_URL || 'http://catalog-service:3000';
                                                    const tokenCli = this.configService.get<string>('SERVICE_TOKEN') || process.env.SERVICE_TOKEN;
                                                    const fetchFn2 = (globalThis as any).fetch;
                                                    if (typeof fetchFn2 === 'function') {
                                                        const apiBaseCli = baseCli.replace(/\/+$/, '') + (baseCli.includes('/api') ? '' : '/api');
                                                        const clientUrl = apiBaseCli + '/internal/clients/' + cart.cliente_id;
                                                        const clientResp: any = await fetchFn2(clientUrl, { headers: tokenCli ? { Authorization: 'Bearer ' + tokenCli } : {} });
                                                        if (clientResp && clientResp.ok) {
                                                            const clientBody = await clientResp.json();
                                                            const listaId = clientBody?.lista_precios_id ?? null;
                                                            if (listaId && Array.isArray(best.precios) && best.precios.length) {
                                                                const match = best.precios.find((p: any) => Number(p.lista_id) === Number(listaId));
                                                                if (match) chosenPrice = Number(match.precio);
                                                            }
                                                        }
                                                    }
                                                }
                                            } catch (err) {
                                                this.logger.debug('No se pudo resolver lista del cliente para precio', { err: err?.message || String(err) });
                                            }

                                            // Fallback: usar precio mínimo si no se obtuvo precio de la lista del cliente
                                            if (chosenPrice == null && Array.isArray(best.precios) && best.precios.length) {
                                                chosenPrice = Math.min(...best.precios.map((p: any) => Number(p.precio || 0)));
                                            }

                                            if (chosenPrice != null) {
                                                precioUnitarioRef = Number(chosenPrice);
                                                precioOriginalSnapshot = precioUnitarioRef;
                                            }
                                        }
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
import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pedido } from './entities/pedido.entity';
import { DetallePedido } from './entities/detalle-pedido.entity';
import { CarritoCabecera } from './entities/carrito-cabecera.entity';
import { CarritoItem } from './entities/carrito-item.entity';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Pedido)
    private pedidoRepo: Repository<Pedido>,
    @InjectRepository(DetallePedido)
    private detalleRepo: Repository<DetallePedido>,
    @InjectRepository(CarritoCabecera)
    private carritoRepo: Repository<CarritoCabecera>,
    @InjectRepository(CarritoItem)
    private carritoItemRepo: Repository<CarritoItem>,
  ) {}

  async listPedidos() {
    return this.pedidoRepo.find();
  }

  async getPedido(id: string) {
    const p = await this.pedidoRepo.findOne({ where: { id } });
    if (!p) throw new NotFoundException('Pedido no encontrado');
    return p;
  }

  async createPedido(data: Partial<Pedido>) {
    const ent = this.pedidoRepo.create(data as any);
    return this.pedidoRepo.save(ent);
  }

  async updatePedido(id: string, data: Partial<Pedido>) {
    await this.pedidoRepo.update(id, data as any);
    return this.getPedido(id);
  }

  async addDetalle(pedidoId: string, data: Partial<DetallePedido>) {
    const detalle = this.detalleRepo.create({ ...data, pedido: { id: pedidoId } } as any);
    return this.detalleRepo.save(detalle);
  }

  // CART methods
  async getCartForUser(userId: string) {
    const cart: CarritoCabecera | null = await this.carritoRepo.findOneBy({ usuario_id: userId } as any);
    if (!cart) return { cart: null, items: [] };
    const items = await this.carritoItemRepo.find({ where: { carrito_id: cart.id } });
    return { cart, items };
  }

  async addOrUpdateCartItem(userId: string, item: Partial<CarritoItem>) {
    try {
      let cart: CarritoCabecera | null = await this.carritoRepo.findOneBy({ usuario_id: userId } as any);
      if (!cart) {
        cart = this.carritoRepo.create({ usuario_id: userId } as Partial<CarritoCabecera>);
        cart = await this.carritoRepo.save(cart);
      }

      const existing = await this.carritoItemRepo.findOne({ where: { carrito_id: cart.id, producto_id: item.producto_id } });
      if (existing) {
        existing.cantidad = item.cantidad as any ?? existing.cantidad;
        existing.precio_unitario_ref = item.precio_unitario_ref as any ?? existing.precio_unitario_ref;
        return this.carritoItemRepo.save(existing);
      }

      const nuevo = this.carritoItemRepo.create({ ...item, carrito_id: cart.id } as any);
      return this.carritoItemRepo.save(nuevo);
    } catch (err) {
      console.error('Error en addOrUpdateCartItem:', err);
      throw new InternalServerErrorException('Error al actualizar carrito');
    }
  }

  async deleteCartItem(userId: string, itemId: string) {
    const cart: CarritoCabecera | null = await this.carritoRepo.findOneBy({ usuario_id: userId } as any);
    if (!cart) throw new NotFoundException('Carrito no encontrado');
    const item = await this.carritoItemRepo.findOne({ where: { id: itemId, carrito_id: cart.id } });
    if (!item) throw new NotFoundException('Item no encontrado en el carrito');
    return this.carritoItemRepo.delete(itemId);
  }
}

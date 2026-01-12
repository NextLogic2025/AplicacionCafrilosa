import { useEffect, useState } from 'react'
import { useCart } from '../../cartContext'
import { toast } from 'sonner'
import { PageHero } from '../../../../components/ui/PageHero'
import { ActionButton } from '../../../../components/ui/ActionButton'
import { EmptyContent } from '../../../../components/ui/EmptyContent'
import { ShoppingCart, Users, Package, Percent, Send, Trash2 } from 'lucide-react'
import { getClientesAsignados, getProductosPorCliente, createPedido } from '../../services/vendedorApi'
import type { Cliente } from '../../../supervisor/services/clientesApi'
import type { Producto } from '../../types'
import { CardGrid } from '../../../../components/ui/CardGrid'
import { ProductCard } from '../../../../components/ui/ProductCard'
import type { Producto as ProductoCliente } from '../../../cliente/types'

export default function VendedorCrearPedido() {
  const { cart, removeFromCart, clearCart, updateQuantity } = useCart();
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [clienteSeleccionado, setClienteSeleccionado] = useState<string>('')
  const [productos, setProductos] = useState<Producto[]>([])
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [isLoadingClientes, setIsLoadingClientes] = useState(false)
  const [isLoadingProductos, setIsLoadingProductos] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // El carrito ahora es global

  // addToCart ahora es global

  useEffect(() => {
    let mounted = true
    const cargar = async () => {
      setIsLoadingClientes(true)
      try {
        const data = await getClientesAsignados().catch(() => [])
        if (mounted) setClientes(data)
      } catch (e: any) {
        if (mounted) setError('No se pudieron cargar tus clientes')
      } finally {
        if (mounted) setIsLoadingClientes(false)
      }
    }
    cargar()
    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    if (!clienteSeleccionado) {
      setProductos([])
      return
    }
    let mounted = true
    const cargarProductos = async () => {
      setIsLoadingProductos(true)
      try {
        const items = await getProductosPorCliente(clienteSeleccionado).catch(() => [])
        if (mounted) setProductos(items)
      } catch (e: any) {
        if (mounted) setError('No se pudieron cargar los productos para este cliente')
      } finally {
        if (mounted) setIsLoadingProductos(false)
      }
    }
    cargarProductos()
    return () => {
      mounted = false
    }
  }, [clienteSeleccionado])
  // Lógica para enviar pedido
  const [isSending, setIsSending] = useState(false);
  const totalPedido = cart.reduce((acc, item) => acc + Number(item.unitPrice) * item.quantity, 0);
  const itemsCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = totalPedido;
  const descuentos = 0; // Si en el futuro hay precio original, calcular ahorro aquí
  const totalCalculado = Math.max(0, subtotal - descuentos);
  const handleEnviarPedido = async () => {
    if (!clienteSeleccionado) {
      toast.error('Selecciona un cliente para asignar el pedido');
      return;
    }
    if (cart.length === 0) {
      toast.error('Agrega productos o promociones al carrito');
      return;
    }
    setIsSending(true);
    try {
      await createPedido(
        clienteSeleccionado,
        cart.map(({ id, unitPrice, quantity }) => ({ id, unitPrice, quantity }))
      );
      toast.success('¡Pedido enviado correctamente!');
      clearCart();
      setClienteSeleccionado('');
    } catch (e) {
      console.error('Error al enviar pedido:', e);
      toast.error('Error al enviar el pedido');
    } finally {
      setIsSending(false);
    }
  };
  return (
    <div className="space-y-6">
      <PageHero
        title="Crear Pedido"
        subtitle="Módulo central para la gestión de ventas"
        chips={[
          { label: 'Módulo principal', variant: 'red' },
          { label: 'Gestión comercial', variant: 'blue' },
        ]}
      />

      {/* Selección de Cliente */}
      <section className="rounded-xl border border-neutral-200 bg-white p-6">
        <h3 className="text-lg font-bold text-neutral-950 mb-4 flex items-center gap-2">
          <Users className="h-5 w-5 text-brand-red" />
          1. Selecciona Cliente
        </h3>
        <div className="flex gap-3">
          <div className="flex-1">
            <select
              value={clienteSeleccionado}
              onChange={(e) => setClienteSeleccionado(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent"
            >
              <option value="">Selecciona un cliente...</option>
              {isLoadingClientes ? <option value="">Cargando...</option> : null}
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>{c.razon_social || c.nombre_comercial || c.identificacion}</option>
              ))}
            </select>
          </div>
          <ActionButton variant="secondary" onClick={() => { /* abrir modal de detalles si se desea */ }}>
            Ver Detalles
          </ActionButton>
        </div>
        <p className="text-sm text-neutral-500 mt-2">
          Selecciona un cliente de tu cartera para iniciar el pedido
        </p>
      </section>

      {/* Agregar Productos */}
      <section className="rounded-xl border border-neutral-200 bg-white p-6">
        <h3 className="text-lg font-bold text-neutral-950 mb-4 flex items-center gap-2">
          <Package className="h-5 w-5 text-brand-red" />
          2. Agrega Productos
        </h3>
        {/* Mostrar solo productos/promociones agregados al carrito como cartas */}
        {cart.length === 0 ? (
          <EmptyContent
            icon={<ShoppingCart className="h-16 w-16" />}
            title="No has agregado productos"
            description="Agrega productos o promociones desde el catálogo para verlos aquí."
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {cart.map((item) => {
              const unit = Number(item.unitPrice) || 0;
              const total = unit * item.quantity;
              return (
                <div key={item.id} className="overflow-hidden rounded-lg border border-gray-100 bg-white shadow transition hover:shadow-lg h-full flex flex-col">
                  <div className="relative flex h-40 w-full items-center justify-center overflow-hidden bg-gray-200 rounded-t-lg">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                  <div className="p-4 flex flex-col gap-2 flex-1">
                    <h3 className="font-semibold text-gray-900">{item.name}</h3>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Precio unitario</span>
                      <span className="font-bold text-brand-red">${unit.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm text-gray-600">Cantidad</span>
                      <div className="flex items-center gap-2">
                        <button
                          className="rounded border px-2 py-1 text-sm"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                        >-</button>
                        <input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) => updateQuantity(item.id, Number(e.target.value))}
                          className="w-16 rounded border px-2 py-1 text-sm"
                        />
                        <button
                          className="rounded border px-2 py-1 text-sm"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >+</button>
                      </div>
                    </div>
                    {item.promo ? <span className="self-start px-2 py-0.5 rounded bg-yellow-100 text-yellow-800 text-xs">Promoción</span> : null}
                    <div className="flex items-center justify-between border-t border-gray-100 pt-2 mt-auto">
                      <span className="text-sm text-gray-600">Total</span>
                      <span className="font-bold text-brand-red text-base">${total.toFixed(2)}</span>
                    </div>
                    <button
                      className="flex items-center gap-1 justify-center mt-2 w-full rounded-lg border border-red-500 bg-white px-3 py-2 text-sm font-medium text-red-500 transition hover:bg-red-50"
                      onClick={() => {
                        removeFromCart(item.id);
                        toast.success('Producto eliminado del carrito');
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                      Eliminar
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Condición Comercial */}
      <section className="rounded-xl border border-neutral-200 bg-white p-6">
        <h3 className="text-lg font-bold text-neutral-950 mb-4">4. Define Condición Comercial</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Forma de Pago
            </label>
            <select className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent">
              <option value="">Seleccionar...</option>
              <option value="contado">Contado</option>
              <option value="credito">Crédito</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Días de Crédito
            </label>
            <input
              type="number"
              placeholder="0"
              className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent"
            />
          </div>
        </div>
      </section>

      {/* Resumen */}
      <section className="rounded-xl border border-brand-red bg-brand-red/5 p-6">
        <h3 className="text-lg font-bold text-neutral-950 mb-4">Resumen del Pedido</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-neutral-600">Subtotal:</span>
            <span className="font-semibold text-neutral-950">${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-600">Descuentos:</span>
            <span className="font-semibold text-green-600">${descuentos.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-600">Items:</span>
            <span className="font-semibold text-neutral-950">{itemsCount}</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-neutral-200">
            <span className="font-bold text-neutral-950">Total:</span>
            <span className="font-bold text-brand-red text-lg">${totalCalculado.toFixed(2)}</span>
          </div>
        </div>
      </section>

      {/* Acciones */}
      <section className="flex flex-wrap gap-3">
        <ActionButton
          variant="primary"
          icon={<Send className="h-4 w-4" />}
          onClick={handleEnviarPedido}
          disabled={isSending || cart.length === 0 || !clienteSeleccionado}
        >
          {isSending ? 'Enviando...' : 'Enviar Pedido a Bodega'}
        </ActionButton>
        <ActionButton variant="secondary">
          Guardar Borrador
        </ActionButton>
        <ActionButton variant="danger" icon={<Trash2 className="h-4 w-4" />}>
          Cancelar
        </ActionButton>
      </section>

      {/* Información */}
      <section className="rounded-xl border border-blue-200 bg-blue-50 p-6">
        <h4 className="font-semibold text-blue-900 mb-2">Flujo del Pedido</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>✓ Crea pedidos para clientes de tu cartera</li>
          <li>✓ Edita el carrito antes de enviar</li>
          <li>✓ El pedido se envía a bodega para validación de stock</li>
          <li>✗ No puedes validar stock directamente</li>
          <li>✗ La facturación la genera el ERP automáticamente</li>
        </ul>
      </section>
    </div>
  )
}

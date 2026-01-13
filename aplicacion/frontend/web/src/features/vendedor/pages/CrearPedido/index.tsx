import { useEffect, useState } from 'react'
import { PageHero } from '../../../../components/ui/PageHero'
import { ActionButton } from '../../../../components/ui/ActionButton'
import { EmptyContent } from '../../../../components/ui/EmptyContent'
import { ShoppingCart, Users, Package, Percent, Send, Trash2 } from 'lucide-react'
import { getClientesAsignados, getProductosPorCliente } from '../../services/vendedorApi'
import type { Cliente } from '../../../supervisor/services/clientesApi'
import type { Producto } from '../../services/vendedorApi'
import { CardGrid } from '../../../../components/ui/CardGrid'
import { StatusBadge } from '../../../../components/ui/StatusBadge'
import { ProductCard } from '../../../../components/ui/ProductCard'
import type { Producto as ProductoCliente } from '../../../cliente/types'

export default function VendedorCrearPedido() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [clienteSeleccionado, setClienteSeleccionado] = useState<string>('')
  const [productos, setProductos] = useState<Producto[]>([])
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [isLoadingClientes, setIsLoadingClientes] = useState(false)
  const [isLoadingProductos, setIsLoadingProductos] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cart, setCart] = useState<Array<{ id: string; name: string; unitPrice: number; quantity: number }>>([])

  const addToCart = (item: { id: string; name: string; unitPrice: number; quantity: number }) => {
    setCart((s) => {
      const idx = s.findIndex((it) => it.id === item.id)
      if (idx >= 0) {
        const copy = [...s]
        copy[idx] = { ...copy[idx], quantity: copy[idx].quantity + item.quantity }
        return copy
      }
      return [...s, item]
    })
  }

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
        {isLoadingProductos ? (
          <div className="py-6 text-center text-sm text-neutral-600">Cargando productos...</div>
        ) : productos.length === 0 ? (
          <EmptyContent
            icon={<ShoppingCart className="h-16 w-16" />}
            title={clienteSeleccionado ? 'No hay productos para este cliente' : 'Carrito vacío'}
            description={clienteSeleccionado ? 'No se encontraron productos asignados a este cliente.' : 'Selecciona un cliente para comenzar a agregar productos'}
          />
        ) : (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <div className="flex-1 pr-4">
                <input
                  type="text"
                  placeholder="Buscar producto..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-lg border border-neutral-200 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-brand-red"
                />
              </div>
            </div>

            {/* Separar productos con promoción y sin promoción */}
            {/** promoted: tiene precio de oferta o promociones **/}
            {(() => {
              const term = searchTerm.trim().toLowerCase()
              const filtered = productos.filter((p) => {
                const name = ((p as any).nombre ?? (p as any).name ?? '').toString().toLowerCase()
                const sku = ((p as any).codigo_sku ?? '').toString().toLowerCase()
                return term === '' || name.includes(term) || sku.includes(term)
              })

              const regular = filtered.filter((p) => {
                const hasPromo = (p as any).precio_oferta != null || (Array.isArray((p as any).promociones) && (p as any).promociones.length > 0)
                return !hasPromo
              })

              return (
                <>
                  <div>
                    <h4 className="mb-3 text-sm font-semibold">Catálogo ({regular.length})</h4>
                    {regular.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-neutral-200 bg-neutral-50 p-6 text-sm text-neutral-600">No hay productos en el catálogo para este cliente.</div>
                    ) : (
                      <CardGrid
                        items={regular.map((p) => ({
                          id: p.id,
                          image: (p as any).imagen_url ?? (p as any).image ?? null,
                          title: (p as any).nombre ?? (p as any).name ?? 'Producto sin nombre',
                          subtitle: (p as any).codigo_sku ? `SKU: ${(p as any).codigo_sku}` : undefined,
                          description: (p as any).descripcion ?? (p as any).description ?? undefined,
                          tags: (p as any).categoria ? [(p as any).categoria.nombre ?? String((p as any).categoria)] : undefined,
                          extra: (
                            <StatusBadge variant={(p as any).activo ? 'success' : 'neutral'}>
                              {(p as any).activo ? 'Activo' : 'Inactivo'}
                            </StatusBadge>
                          ),
                          actions: (
                            <div className="flex w-full items-center justify-between gap-2">
                              <div className="text-right">
                                <div className="text-sm font-bold">${((p as any).precio_oferta ?? (p as any).price ?? 0).toFixed(2)}</div>
                              </div>
                              <button className="ml-2 rounded-lg border border-brand-red bg-white px-3 py-2 text-sm font-semibold text-brand-red shadow-sm transition hover:bg-brand-red/90 hover:text-white">Agregar</button>
                            </div>
                          ),
                        }))}
                        columns={4}
                      />
                    )}
                  </div>
                </>
              )
            })()}
          </div>
        )}
      </section>

      {/* Promociones */}
      <section className="rounded-xl border border-neutral-200 bg-white p-6">
        <h3 className="text-lg font-bold text-neutral-950 mb-4 flex items-center gap-2">
          <Percent className="h-5 w-5 text-brand-red" />
          3. Aplica Promociones
        </h3>
        <p className="text-sm text-neutral-500">Las promociones aplicables se mostrarán automáticamente según los productos seleccionados</p>
        <div className="mt-4">
          {productos.length === 0 ? (
            <div className="text-sm text-neutral-500">Selecciona un cliente para ver promociones aplicables.</div>
          ) : (
            (() => {
              const promos = productos.filter((p) => (p as any).precio_oferta != null || (Array.isArray((p as any).promociones) && (p as any).promociones.length > 0))
              if (promos.length === 0) return <div className="text-sm text-neutral-500">No hay promociones aplicables.</div>
              const mapped = promos.map((p) => {
                const prod: ProductoCliente = {
                  id: (p as any).id,
                  name: (p as any).nombre ?? (p as any).name ?? '',
                  description: (p as any).descripcion ?? (p as any).description ?? '',
                  price: Number((p as any).price ?? (p as any).precio_oferta ?? 0),
                  precio_original: (p as any).precio_original ?? null,
                  precio_oferta: (p as any).precio_oferta ?? (p as any).precio_oferta_fijo ?? null,
                  ahorro: null,
                  promociones: (p as any).promociones ?? [],
                  campania_aplicada_id: (p as any).campania_aplicada_id ?? null,
                  image: (p as any).imagen_url ?? (p as any).image ?? undefined,
                  category: (p as any).categoria?.nombre ?? (p as any).category ?? '',
                  inStock: Boolean((p as any).activo ?? (p as any).inStock ?? true),
                }
                return prod
              })

              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {mapped.map((mp) => (
                    <ProductCard key={mp.id} producto={mp} onAddToCart={(item) => addToCart(item)} fetchPromos addButtonLabel="Agregar" />
                  ))}
                </div>
              )
            })()
          )}
        </div>
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
            <span className="font-semibold text-neutral-950">--</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-600">Descuentos:</span>
            <span className="font-semibold text-green-600">--</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-neutral-200">
            <span className="font-bold text-neutral-950">Total:</span>
            <span className="font-bold text-brand-red text-lg">--</span>
          </div>
        </div>
      </section>

      {/* Acciones */}
      <section className="flex flex-wrap gap-3">
        <ActionButton variant="primary" icon={<Send className="h-4 w-4" />}>
          Enviar Pedido a Bodega
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

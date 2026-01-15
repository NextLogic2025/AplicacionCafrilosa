import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ShoppingCart, Users, Package, Percent, Send, Trash2, Minus, Plus, Info, Building2, CheckCircle2 } from 'lucide-react'

import { PageHero } from '../../../../components/ui/PageHero'
import { EmptyContent } from '../../../../components/ui/EmptyContent'
import { ProductCard } from '../../../../components/ui/ProductCard'
import { Alert } from 'components/ui/Alert'
import { CartProvider, useCart } from '../../../cliente/cart/CartContext'
import {
  getClientesAsignados,
  getProductosPorCliente,
  getSucursalesPorCliente,
  createPedidoFromCartCliente,
} from '../../services/vendedorApi'
import type { Cliente } from '../../../supervisor/services/clientesApi'
import type { Producto as ProductoCliente, SucursalCliente } from '../../../cliente/types'

type ClienteSelectOption = {
  id: string
  label: string
}

const PAYMENT_OPTIONS: Array<{ label: string; value: 'CONTADO' | 'CREDITO' }> = [
  { label: 'Efectivo', value: 'CONTADO' },
  { label: 'Crédito', value: 'CREDITO' },
]

export default function VendedorCarrito() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [clientes, setClientes] = useState<ClienteSelectOption[]>([])
  const [clientesRaw, setClientesRaw] = useState<Cliente[]>([])
  const [clienteSeleccionado, setClienteSeleccionado] = useState<string>('')
  const [productos, setProductos] = useState<ProductoCliente[]>([])
  const [sucursales, setSucursales] = useState<SucursalCliente[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoadingClientes, setIsLoadingClientes] = useState(false)
  const [isLoadingProductos, setIsLoadingProductos] = useState(false)
  const [isLoadingSucursales, setIsLoadingSucursales] = useState(false)

  useEffect(() => {
    let mounted = true
    setIsLoadingClientes(true)
    getClientesAsignados()
      .then(list => {
        if (!mounted) return
        setClientesRaw(list)
        setClientes(
          list.map(cliente => ({
            id: cliente.id,
            label: cliente.razon_social || cliente.nombre_comercial || cliente.identificacion,
          })),
        )
      })
      .catch(() => {
        if (mounted) setError('No se pudieron cargar tus clientes')
      })
      .finally(() => {
        if (mounted) setIsLoadingClientes(false)
      })
    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    const queryCliente = searchParams.get('cliente')
    if (queryCliente && !clienteSeleccionado) {
      setClienteSeleccionado(queryCliente)
    }
  }, [searchParams, clienteSeleccionado])

  const handleClienteChange = (value: string) => {
    setClienteSeleccionado(value)
    const nextParams = new URLSearchParams(searchParams)
    if (value) {
      nextParams.set('cliente', value)
    } else {
      nextParams.delete('cliente')
    }
    setSearchParams(nextParams, { replace: true })
  }

  useEffect(() => {
    if (!clienteSeleccionado) {
      setProductos([])
      setSucursales([])
      return
    }
    let mounted = true
    setIsLoadingProductos(true)
    getProductosPorCliente(clienteSeleccionado)
      .then(items => {
        if (!mounted) return
        setProductos(Array.isArray(items) ? items : [])
      })
      .catch(() => {
        if (mounted) setError('No se pudieron cargar los productos para este cliente')
      })
      .finally(() => {
        if (mounted) setIsLoadingProductos(false)
      })

    setIsLoadingSucursales(true)
    getSucursalesPorCliente(clienteSeleccionado)
      .then(data => {
        if (!mounted) return
        const mappedRaw = (Array.isArray(data) ? data : []).map(raw => {
          const id = raw?.id ?? raw?.sucursal_id
          if (!id) return null
          return {
            id: String(id),
            nombre: String(
              raw?.nombre_sucursal ??
                raw?.nombre ??
                raw?.alias ??
                (raw?.contacto_nombre ? `Sucursal ${raw.contacto_nombre}` : 'Sucursal'),
            ),
            direccion: raw?.direccion_entrega ?? raw?.direccion ?? raw?.direccion_exacta ?? null,
            ciudad: raw?.municipio ?? raw?.ciudad ?? null,
            estado: raw?.departamento ?? raw?.estado ?? null,
          }
        })
        const mapped = mappedRaw.filter(Boolean) as SucursalCliente[]
        setSucursales(mapped)
      })
      .catch(() => {
        if (mounted) setError('No se pudieron cargar las sucursales de este cliente')
      })
      .finally(() => {
        if (mounted) setIsLoadingSucursales(false)
      })

    return () => {
      mounted = false
    }
  }, [clienteSeleccionado])

  const clienteActivo = useMemo(
    () => clientesRaw.find(cliente => cliente.id === clienteSeleccionado) ?? null,
    [clientesRaw, clienteSeleccionado],
  )

  return (
    <div className="space-y-6">
      <PageHero
        title="Carrito por cliente"
        subtitle="Gestiona el carrito y pedidos para cada cuenta asignada"
        chips={[
          { label: 'Carrito sincronizado', variant: 'red' },
          { label: 'Flujo oficial Orders', variant: 'blue' },
        ]}
      />

      {error ? (
        <Alert variant="destructive">{error}</Alert>
      ) : null}

      <section className="rounded-xl border border-neutral-200 bg-white p-6">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-neutral-950">
          <Users className="h-5 w-5 text-brand-red" /> 1. Selecciona cliente
        </h3>
        <div className="flex gap-3">
          <div className="flex-1">
            <select
              value={clienteSeleccionado}
              onChange={event => handleClienteChange(event.target.value)}
              className="w-full rounded-lg border border-neutral-200 px-4 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-red"
            >
              <option value="">Selecciona un cliente...</option>
              {isLoadingClientes ? <option value="">Cargando...</option> : null}
              {clientes.map(cliente => (
                <option key={cliente.id} value={cliente.id}>
                  {cliente.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <p className="mt-2 text-sm text-neutral-500">
          El carrito se sincroniza con el endpoint `/orders/cart/client/:clienteId` automáticamente.
        </p>
      </section>

      {clienteSeleccionado ? (
        <CartProvider
          key={clienteSeleccionado}
          clienteId={clienteSeleccionado}
          storageKey="cafrilosa:cart:vendedor"
        >
          <ClienteCartExperience
            key={clienteSeleccionado}
            clienteId={clienteSeleccionado}
            cliente={clienteActivo}
            productos={productos}
            isLoadingProductos={isLoadingProductos}
            isLoadingSucursales={isLoadingSucursales}
            sucursales={sucursales}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onPedidoCreado={(id) => {
              try {
                if (id && typeof navigator?.clipboard?.writeText === 'function') navigator.clipboard.writeText(id)
              } catch {}
              navigate('/vendedor/pedidos', { replace: true })
              if (id) {
                try {
                  // Informal feedback: quick alert confirming copy
                  // (kept simple for now; can be replaced with a toast)
                  // eslint-disable-next-line no-alert
                  alert('Pedido creado: ' + id + ' (copiado al portapapeles)')
                } catch {}
              }
            }}
          />
        </CartProvider>
      ) : (
        <EmptyContent
          icon={<ShoppingCart className="h-16 w-16" />}
          title="Selecciona un cliente"
          description="El carrito y los productos disponibles aparecerán después de elegir una cuenta."
        />
      )}
    </div>
  )
}

type ClienteCartExperienceProps = {
  clienteId: string
  cliente: Cliente | null
  productos: ProductoCliente[]
  isLoadingProductos: boolean
  isLoadingSucursales: boolean
  sucursales: SucursalCliente[]
  searchTerm: string
  onSearchChange: (value: string) => void
  onPedidoCreado: (id?: string) => void
}

function ClienteCartExperience({
  clienteId,
  cliente,
  productos,
  isLoadingProductos,
  isLoadingSucursales,
  sucursales,
  searchTerm,
  onSearchChange,
  onPedidoCreado,
}: ClienteCartExperienceProps) {
  const { items, total, addItem, updateQuantity, removeItem, clearCart, warnings, removedItems } = useCart()
  const [destinoTipo, setDestinoTipo] = useState<'cliente' | 'sucursal'>('cliente')
  const [selectedSucursalId, setSelectedSucursalId] = useState<string | null>(null)
  const [condicionPago, setCondicionPago] = useState<'CONTADO' | 'CREDITO'>('CONTADO')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const creditoDisponible = useMemo(() => {
    const limite = cliente?.limite_credito ? Number(cliente.limite_credito) : 0
    const saldo = cliente?.saldo_actual ? Number(cliente.saldo_actual) : 0
    return Math.max(limite - saldo, 0)
  }, [cliente])

  const superaCredito = cliente?.tiene_credito ? total > creditoDisponible : false

  useEffect(() => {
    if (cliente?.tiene_credito && !superaCredito) {
      setCondicionPago('CREDITO')
    } else {
      setCondicionPago('CONTADO')
    }
  }, [cliente, superaCredito])

  useEffect(() => {
    if (destinoTipo !== 'sucursal') {
      setSelectedSucursalId(null)
      return
    }
    if (sucursales.length === 0) {
      setDestinoTipo('cliente')
      setSelectedSucursalId(null)
      return
    }
    if (!selectedSucursalId) {
      setSelectedSucursalId(sucursales[0].id)
    }
  }, [destinoTipo, sucursales, selectedSucursalId])

  const filteredProductos = useMemo(() => {
    if (!searchTerm.trim()) return productos
    const term = searchTerm.trim().toLowerCase()
    return productos.filter(producto => {
      return (
        producto.name.toLowerCase().includes(term) ||
        producto.description.toLowerCase().includes(term)
      )
    })
  }, [productos, searchTerm])

  const productosPromocion = filteredProductos.filter(
    producto => producto.precio_oferta != null || (Array.isArray(producto.promociones) && producto.promociones.length > 0),
  )
  const productosCatalogo = filteredProductos.filter(producto => !productosPromocion.includes(producto))

  const handleConfirmar = async () => {
    if (items.length === 0 || isSubmitting) return
    if (!clienteId) return
    if (destinoTipo === 'sucursal' && !selectedSucursalId) {
      setSubmitError('Selecciona una sucursal válida para este pedido.')
      return
    }
    setSubmitError(null)
    setIsSubmitting(true)
    try {
      const nuevo = await createPedidoFromCartCliente(clienteId, {
        condicionPago,
        sucursalId: destinoTipo === 'sucursal' ? selectedSucursalId : undefined,
      })
      clearCart()
      try {
        window.dispatchEvent(new CustomEvent('pedidoCreado', { detail: { message: 'Pedido creado correctamente' } }))
      } catch {}
      try {
        const id = (nuevo as any)?.id
        onPedidoCreado(id)
      } catch {
        onPedidoCreado()
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo crear el pedido'
      setSubmitError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const subtotalTexto = `$${total.toFixed(2)}`
  const creditoTexto = `$${creditoDisponible.toFixed(2)}`

  return (
    <div className="space-y-6">
      {/* Sección "2. Agrega productos" eliminada por solicitud del cliente. */}

      <section className="rounded-xl border border-neutral-200 bg-white p-6">
        <h3 className="mb-4 text-lg font-bold text-neutral-950">3. Carrito sincronizado</h3>
        {warnings && warnings.length > 0 ? (
          <div className="mb-4">
            <Alert variant="warning">{warnings.map(w => w.issue).join(', ')}</Alert>
          </div>
        ) : null}
        {removedItems && removedItems.length > 0 ? (
          <div className="mb-4">
            <Alert variant="destructive">
              El backend depuró líneas inválidas: {removedItems.map(item => item.producto_id).join(', ')}
            </Alert>
          </div>
        ) : null}

        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 px-4 py-6 text-center text-sm text-neutral-600">
            Aún no agregas productos. Usa el catálogo para iniciar el carrito.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="max-h-[50vh] space-y-3 overflow-auto pr-2">
              {items.map(item => (
                <div key={item.id} className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-neutral-900">{item.name}</p>
                    <p className="text-xs text-neutral-500">Precio estimado: ${item.unitPrice.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      aria-label="Disminuir"
                      onClick={() => updateQuantity(item.id, Math.max(item.quantity - 1, 0))}
                      className="rounded-lg border border-neutral-200 bg-neutral-50 p-1 text-neutral-700 hover:bg-neutral-100"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                    <button
                      type="button"
                      aria-label="Aumentar"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="rounded-lg border border-neutral-200 bg-neutral-50 p-1 text-neutral-700 hover:bg-neutral-100"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="w-24 text-right text-sm font-bold text-neutral-900">${(item.unitPrice * item.quantity).toFixed(2)}</div>
                  <button
                    type="button"
                    aria-label="Eliminar"
                    onClick={() => removeItem(item.id)}
                    className="rounded-lg bg-red-50 p-2 text-brand-red hover:bg-red-100"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-xs text-neutral-700">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-neutral-500" />
                Stock y promociones se recalculan en el backend al confirmar el pedido.
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-neutral-600">Total estimado</p>
                  <p className="text-xl font-bold text-neutral-900">{subtotalTexto}</p>
                </div>
                {cliente?.tiene_credito ? (
                  <div className="mt-3 space-y-1 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-600">Crédito disponible</span>
                      <span className={superaCredito ? 'font-semibold text-brand-red' : 'font-semibold text-emerald-700'}>
                        {creditoTexto}
                      </span>
                    </div>
                    {superaCredito ? (
                      <div className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-800">
                        El total supera el crédito. Se forzará pago Contado.
                      </div>
                    ) : (
                      <div className="rounded-xl bg-green-50 px-3 py-2 text-xs text-green-800">
                        <CheckCircle2 className="mr-1 inline h-4 w-4" /> Dentro del cupo disponible.
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-neutral-500">Este cliente no tiene crédito registrado.</p>
                )}
              </div>

              <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
                <p className="mb-2 text-sm font-semibold text-neutral-700">Condición comercial</p>
                <select
                  value={condicionPago}
                  onChange={event => setCondicionPago(event.target.value as typeof condicionPago)}
                  className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-red"
                  disabled={superaCredito}
                >
                  {PAYMENT_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {superaCredito ? (
                  <p className="mt-2 text-xs text-red-700">
                    Para montos superiores al crédito disponible, solo se permite pago contado.
                  </p>
                ) : null}
              </div>

              <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
                <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-neutral-700">
                  <Building2 className="h-4 w-4 text-brand-red" /> Destino del pedido
                </p>
                <div className="space-y-2 text-sm">
                  <label className={`flex cursor-pointer items-start gap-2 rounded-xl border px-3 py-2 ${destinoTipo === 'cliente' ? 'border-brand-red/50 bg-brand-red/5' : 'border-neutral-200 hover:border-neutral-300'}`}>
                    <input
                      type="radio"
                      name="destino"
                      checked={destinoTipo === 'cliente'}
                      onChange={() => setDestinoTipo('cliente')}
                      className="mt-1"
                    />
                    <div>
                      <p className="font-semibold text-neutral-900">Dirección principal</p>
                      <p className="text-xs text-neutral-500">Usa la dirección legal registrada en catálogo.</p>
                    </div>
                  </label>
                  <label className={`flex cursor-pointer items-start gap-2 rounded-xl border px-3 py-2 ${destinoTipo === 'sucursal' ? 'border-brand-red/50 bg-brand-red/5' : 'border-neutral-200 hover:border-neutral-300'} ${sucursales.length === 0 ? 'opacity-60' : ''}`}>
                    <input
                      type="radio"
                      name="destino"
                      checked={destinoTipo === 'sucursal'}
                      onChange={() => setDestinoTipo('sucursal')}
                      disabled={sucursales.length === 0}
                      className="mt-1"
                    />
                    <div>
                      <p className="font-semibold text-neutral-900">Sucursal</p>
                      <p className="text-xs text-neutral-500">
                        {sucursales.length > 0
                          ? 'Enviaremos el pedido a una sucursal registrada.'
                          : 'Este cliente aún no registra sucursales con ID válido.'}
                      </p>
                    </div>
                  </label>
                </div>
                {destinoTipo === 'sucursal' ? (
                  <div className="mt-3 space-y-2 rounded-xl border border-dashed border-brand-red/30 bg-brand-red/5 px-3 py-3 text-sm">
                    {isLoadingSucursales ? (
                      <p className="text-neutral-500">Cargando sucursales...</p>
                    ) : sucursales.length === 0 ? (
                      <p className="text-neutral-500">Sin sucursales disponibles.</p>
                    ) : (
                      sucursales.map(sucursal => (
                        <label
                          key={sucursal.id}
                          className={`flex cursor-pointer items-start gap-2 rounded-xl border bg-white px-3 py-2 text-xs ${selectedSucursalId === sucursal.id ? 'border-brand-red/60 shadow-sm' : 'border-brand-red/10 hover:border-brand-red/40'}`}
                        >
                          <input
                            type="radio"
                            name="sucursal"
                            checked={selectedSucursalId === sucursal.id}
                            onChange={() => setSelectedSucursalId(sucursal.id)}
                            className="mt-1"
                          />
                          <div>
                            <p className="font-semibold text-neutral-900">{sucursal.nombre}</p>
                            <p className="text-neutral-500">
                              {[sucursal.direccion, sucursal.ciudad, sucursal.estado].filter(Boolean).join(' · ') || 'Sin dirección registrada'}
                            </p>
                          </div>
                        </label>
                      ))
                    )}
                  </div>
                ) : null}
              </div>
            </div>

            {submitError ? (
              <Alert variant="destructive">{submitError}</Alert>
            ) : null}

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => clearCart()}
                disabled={items.length === 0}
                className="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Vaciar carrito
              </button>
              <button
                type="button"
                onClick={handleConfirmar}
                disabled={items.length === 0 || isSubmitting}
                className="inline-flex items-center gap-2 rounded-xl bg-brand-red px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-red700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Send className="h-4 w-4" /> Confirmar pedido
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}

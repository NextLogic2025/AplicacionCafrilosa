import React, { useState } from 'react'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import ClienteModal from './ClienteModal'

type Item = {
  producto_id?: string
  producto_nombre?: string
  nombre_producto?: string
  cantidad?: number
  precio_unitario_ref?: number
  precio_final?: number
  precio?: number
  id?: string
  // normalized
  productName?: string
  unitPrice?: number
  subtotal?: number
  quantity?: number
}

type Props = {
  open: boolean
  onClose: () => void
  onCancel?: () => void
  data: any | null
}

export default function PedidoDetalleModal({ open, onClose, onCancel, data }: Props) {
  if (!open || !data) return null

  // Normalize items from possible backend keys
  const rawItems: any[] = Array.isArray(data.items)
    ? data.items
    : Array.isArray(data.detalles)
      ? data.detalles
      : Array.isArray(data.line_items)
        ? data.line_items
        : Array.isArray(data.lines)
          ? data.lines
          : []

  const items: Item[] = rawItems.map((it: any) => {
    const id = String(it.id ?? it.producto_id ?? it.producto ?? it.sku ?? '')
    const quantity = Number(it.cantidad ?? it.qty ?? it.quantity ?? 0)
    const unitPrice = Number(it.precio_final ?? it.precio_unitario_ref ?? it.precio_unitario ?? it.unit_price ?? it.precio ?? 0)
    const subtotal = Number(it.subtotal ?? (unitPrice * quantity))
    const productName = String(it.productName ?? it.producto_nombre ?? it.nombre_producto ?? it.nombre ?? it.product_name ?? id)
    return {
      id,
      producto_id: it.producto_id ?? it.producto ?? undefined,
      producto_nombre: it.producto_nombre ?? undefined,
      nombre_producto: it.nombre_producto ?? undefined,
      cantidad: quantity,
      precio_unitario_ref: unitPrice,
      precio_final: unitPrice,
      precio: unitPrice,
      // additional normalized fields used in UI
      productName,
      unitPrice,
      subtotal,
    } as Item
  })

  const totalLines = items.reduce((s, it) => s + (Number(it.cantidad ?? 0)), 0)
  const totalAmount = Number(
    data.totalAmount ?? data.total_final ?? data.total ?? data.monto_total ??
    items.reduce((s, it) => s + ((it.precio_final ?? it.precio_unitario_ref ?? it.precio ?? 0) * (it.cantidad ?? 0)), 0)
  )
  const [clienteOpen, setClienteOpen] = useState(false)

  const orderNumber = data.numero ?? data.numero_pedido ?? data.order_number ?? data.sequence ?? null
  const paymentMethod = data.payment_method ?? data.metodo_pago ?? data.forma_pago ?? data.tipo_pago ?? data.payment ?? data.condicion_pago ?? '—'
  const origen = data.origen ?? data.source ?? data.from ?? data.creado_por ?? '—'
  const clienteInfo = data.cliente ?? data.cliente_info ?? data.cliente_nombre ? {
    id: data.cliente_id ?? data.cliente,
    nombre: data.cliente_nombre ?? data.cliente_info?.nombre ?? data.cliente_info?.razon_social ?? undefined,
    cedula: data.cliente_info?.cedula ?? data.cliente_info?.identificacion ?? undefined,
    direccion: data.cliente_info?.direccion ?? undefined,
    zona: data.cliente_info?.zona ?? undefined,
    lista_precios: data.cliente_info?.lista_precios ?? data.lista_precios ?? undefined,
    creado_en: data.cliente_info?.created_at ?? undefined,
    credito: data.cliente_info?.credito ?? undefined
  } : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />

      <div className="relative z-10 w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="text-sm text-neutral-600">Detalles del Pedido</div>
          <div className="flex-1 text-center font-bold text-xl">#{orderNumber ?? (String(data.id).slice(0,8))}</div>
          <div className="flex items-center gap-3">
            <StatusBadge variant={String(data.estado).toLowerCase() === 'aprobado' ? 'success' : String(data.estado).toLowerCase() === 'rechazado' ? 'error' : 'warning'}>
              {String(data.estado ?? 'PENDIENTE')}
            </StatusBadge>
            <button onClick={onClose} className="text-neutral-600 hover:text-neutral-900">✕</button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white border rounded-lg p-4">
              <div className="text-xs text-neutral-500">FECHA</div>
              <div className="mt-2 font-semibold">{data.createdAt ? new Date(data.createdAt).toLocaleDateString() : (data.created_at ? new Date(data.created_at).toLocaleDateString() : (data.fecha_creacion ?? '-'))}</div>
            </div>
            <div className="bg-white border rounded-lg p-4">
              <div className="text-xs text-neutral-500">TOTAL LÍNEAS</div>
              <div className="mt-2 font-semibold">{totalLines} unidades</div>
            </div>
            <div className="bg-white border rounded-lg p-4">
              <div className="text-xs text-neutral-500">MONTO TOTAL</div>
              <div className="mt-2 font-semibold text-red-600">{formatCurrency(totalAmount)}</div>
            </div>
          </div>

          <div className="flex items-center justify-between mt-4 gap-4">
            <div className="text-sm text-neutral-700">Cliente: <span className="font-semibold">{clienteInfo?.nombre ?? data.cliente_nombre ?? data.cliente_info?.razon_social ?? data.cliente_id ?? '-'}</span></div>
            <div className="text-sm text-neutral-700">Método: <span className="font-semibold">{String(paymentMethod)}</span></div>
            <div className="text-sm text-neutral-700">Origen: <span className="font-semibold">{String(origen)}</span></div>
            {clienteInfo && (
              <button onClick={() => setClienteOpen(true)} className="ml-2 px-3 py-1 rounded bg-red-50 text-red-600 border border-red-100">Ver cliente</button>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Productos</h4>
              <div className="text-sm text-neutral-500">{items.length} líneas</div>
            </div>

            <div className="mt-3 space-y-2">
              {items.length === 0 ? (
                <div className="text-sm text-neutral-500">No hay productos en este pedido.</div>
              ) : (
                items.map(it => {
                  const id = it.id ?? it.producto_id ?? it.producto ?? ''
                  const name = (it.productName ?? it.producto_nombre ?? it.nombre_producto ?? it.nombre ?? it.producto_nombre ?? id)
                  const qty = Number(it.quantity ?? it.cantidad ?? 0)
                  const unitPrice = Number(it.unitPrice ?? it.precio_unitario_ref ?? it.precio_final ?? it.precio ?? 0)
                  const lineTotal = Number(it.subtotal ?? (unitPrice * qty))
                  return (
                    <div key={id} className="flex items-center justify-between border rounded-lg p-3 bg-white">
                      <div>
                        <div className="font-medium">{name}</div>
                        <div className="text-xs text-neutral-500">{qty} UN × {formatCurrency(unitPrice)}</div>
                      </div>
                      <div className="text-sm font-semibold">{formatCurrency(lineTotal)}</div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            <button onClick={onClose} className="px-6 py-3 rounded-full border">Cerrar</button>
          </div>
        </div>
      </div>
      <ClienteModal cliente={clienteInfo} open={clienteOpen} onClose={() => setClienteOpen(false)} />
    </div>
  )
}

function formatCurrency(n?: number) {
  const v = n ?? 0
  try {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(v)
  } catch (e) {
    return `$${v.toFixed ? v.toFixed(2) : v}`
  }
}

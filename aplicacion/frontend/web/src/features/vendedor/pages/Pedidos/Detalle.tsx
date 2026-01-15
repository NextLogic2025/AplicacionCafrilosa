import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { PageHero } from '../../../../components/ui/PageHero'
import { getPedidoDetalle as getOrderDetail } from '../../../cliente/services/clientApi'
import { StatusBadge } from '../../../../components/ui/StatusBadge'

export default function VendedorPedidoDetalle() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pedido, setPedido] = useState<any | null>(null)

  useEffect(() => {
    let mounted = true
    if (!id) {
      setError('Pedido inválido')
      setLoading(false)
      return
    }
    setLoading(true)
    getOrderDetail(id as string)
      .then(data => {
        if (!mounted) return
        setPedido(data)
      })
      .catch(err => {
        if (!mounted) return
        setError(err instanceof Error ? err.message : 'No se pudo cargar el pedido')
      })
      .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [id])

  return (
    <div className="space-y-6">
      <PageHero title="Detalle del Pedido" subtitle="Resumen del pedido seleccionado" />
      <div className="rounded-xl border border-neutral-200 bg-white p-6">
        {loading ? (
          <div>Cargando...</div>
        ) : error ? (
          <div className="text-red-600">{error}</div>
        ) : pedido ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-semibold">Pedido {pedido.id}</div>
                <div className="text-sm text-neutral-500">Creado: {pedido.created_at ?? pedido.fecha_creacion ?? '—'}</div>
              </div>
              <div>
                <StatusBadge variant={pedido.estado === 'aprobado' ? 'success' : pedido.estado === 'rechazado' ? 'error' : 'warning'}>
                  {pedido.estado ?? 'Pendiente'}
                </StatusBadge>
              </div>
            </div>

            <div>
              <h4 className="font-semibold">Items</h4>
              <div className="mt-2 space-y-2">
                {Array.isArray(pedido.items) && pedido.items.length > 0 ? (
                  pedido.items.map((it: any) => (
                    <div key={it.producto_id || it.id} className="flex items-center justify-between border rounded p-3">
                      <div>
                        <div className="font-medium">{it.producto_nombre ?? it.nombre_producto ?? it.nombre ?? it.id}</div>
                        <div className="text-xs text-neutral-500">Qty: {it.cantidad ?? it.quantity ?? 0}</div>
                      </div>
                      <div className="text-sm font-semibold">${(it.precio_unitario_ref ?? it.precio_final ?? it.precio ?? 0).toFixed ? (it.precio_unitario_ref ?? it.precio_final ?? it.precio ?? 0).toFixed(2) : (it.precio_unitario_ref ?? it.precio_final ?? it.precio ?? 0)}</div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-neutral-500">No hay items disponibles</div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end">
              <button onClick={() => navigate(-1)} className="rounded-lg bg-neutral-100 px-4 py-2">Volver</button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

import React, { useEffect, useState, useMemo } from 'react'
import { PageHero } from '../../../../components/ui/PageHero'
import { StatusBadge } from '../../../../components/ui/StatusBadge'
import { EmptyContent } from '../../../../components/ui/EmptyContent'
import { ClipboardList, Search, Eye } from 'lucide-react'
import { getPedidos } from '../../services/vendedorApi'
import { getPedidoDetalle } from '../../../cliente/services/clientApi'
import PedidoDetalleModal from '../../components/PedidoDetalleModal'

export default function Pedidos() {
  const [pedidos, setPedidos] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedDetailId, setSelectedDetailId] = useState<string | null>(null)
  const [detailData, setDetailData] = useState<any | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)

  const [searchTerm, setSearchTerm] = useState<string>('')
  const [filtroOrigen, setFiltroOrigen] = useState<string>('')
  const [filtroEstado, setFiltroEstado] = useState<string>('')

  useEffect(() => {
    let mounted = true
    setIsLoading(true)
    getPedidos()
      .then((res) => {
        if (!mounted) return
        const raw = res && Array.isArray((res as any).items) ? (res as any).items : Array.isArray(res) ? (res as any[]) : []
        const normalized = (raw as any[]).map((p: any, idx: number) => {
          const displayNumber = p.numero ?? p.numero_pedido ?? p.order_number ?? p.codigo_visual ?? p.sequence ?? (typeof p.id === 'string' ? p.id.slice(0, 8) : String(idx + 1))
          const created_at = p.created_at ?? p.createdAt ?? p.fecha_creacion ?? null
          const estado = p.estado ?? p.status ?? p.estado_actual ?? null
          let total = p.total_final ?? p.total ?? p.monto_total ?? p.totalAmount ?? null
          if (total == null) {
            const detalles = Array.isArray(p.detalles) ? p.detalles : Array.isArray(p.items) ? p.items : []
            total = detalles.reduce((s: number, it: any) => s + (Number(it.precio_final ?? it.precio_unitario ?? it.precio ?? it.unit_price ?? 0) * Number(it.cantidad ?? it.qty ?? it.quantity ?? 0)), 0)
          }
          return { ...p, displayNumber, created_at, estado, total }
        })
        setPedidos(normalized)
      })
      .catch(() => {
        if (!mounted) return
        setPedidos([])
      })
      .finally(() => mounted && setIsLoading(false))

    return () => { mounted = false }
  }, [])

  const filtered = useMemo(() => {
    const s = searchTerm.trim().toLowerCase()
    return pedidos.filter((p) => {
      if (s) {
        const number = String(p.displayNumber ?? p.id ?? '').toLowerCase()
        const clienteName = String(p.cliente_nombre ?? p.cliente_info?.nombre ?? p.cliente ?? p.clienteName ?? '').toLowerCase()
        if (!number.includes(s) && !clienteName.includes(s)) return false
      }

      if (filtroOrigen) {
        const origenRaw = String(p.creado_por ?? p.origen ?? p.source ?? p.from ?? '').toLowerCase()
        if (filtroOrigen === 'vendedor' && !origenRaw.includes('vendedor') && origenRaw !== '') return false
        if (filtroOrigen === 'cliente' && !origenRaw.includes('cliente') && origenRaw !== '') return false
      }

      if (filtroEstado) {
        const estadoRaw = String(p.estado ?? p.status ?? p.estado_actual ?? '').toLowerCase()
        if (!estadoRaw.includes(filtroEstado.toLowerCase())) return false
      }

      return true
    })
  }, [pedidos, searchTerm, filtroOrigen, filtroEstado])

  return (
    <div className="space-y-6">
      <PageHero
        title="Mis Pedidos"
        subtitle="Seguimiento de pedidos creados"
        chips={[
          { label: 'Trazabilidad completa', variant: 'blue' },
          { label: 'Cliente y vendedor', variant: 'green' },
        ]}
      />

      <section className="rounded-xl border border-neutral-200 bg-white p-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-neutral-700 mb-2">Buscar Pedido</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <input
                type="text"
                placeholder="Número de pedido o cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent"
              />
            </div>
          </div>

          <div className="w-48">
            <label className="block text-sm font-medium text-neutral-700 mb-2">Origen</label>
            <select
              value={filtroOrigen}
              onChange={(e) => setFiltroOrigen(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent"
            >
              <option value="">Todos</option>
              <option value="vendedor">Creado por mí</option>
              <option value="cliente">Creado por cliente</option>
            </select>
          </div>

          <div className="w-48">
            <label className="block text-sm font-medium text-neutral-700 mb-2">Estado</label>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent"
            >
              <option value="">Todos</option>
              <option value="pendiente">Pendiente</option>
              <option value="aprobado">Aprobado</option>
              <option value="rechazado">Rechazado</option>
              <option value="facturado">Facturado</option>
              <option value="en-ruta">En Ruta</option>
              <option value="entregado">Entregado</option>
            </select>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-neutral-200 bg-white p-6">
        <h3 className="text-lg font-bold text-neutral-950 mb-4">Pedidos Recientes</h3>
        {isLoading ? (
          <div className="p-6 text-center text-sm text-neutral-600">Cargando pedidos...</div>
        ) : filtered.length === 0 ? (
          <EmptyContent
            icon={<ClipboardList className="h-16 w-16" />}
            title="No hay pedidos registrados"
            description="Los pedidos que crees o que tus clientes generen aparecerán aquí"
          />
        ) : (
          <div className="space-y-3">
            {filtered.map((p) => (
              <div key={p.id}>
                <div className="rounded-lg border p-3 flex items-center justify-between">
                  <div>
                    <div className="font-semibold">Pedido {p.displayNumber ?? p.id}</div>
                    <div className="text-xs text-neutral-500">{p.created_at ? new Date(p.created_at).toLocaleDateString() : '—'}</div>
                  </div>
                  <div className="text-sm text-neutral-700 text-right mr-6">{p.total ? `$${Number(p.total).toFixed(2)}` : '$0.00'}</div>
                  <div className="flex items-center gap-3">
                    <StatusBadge variant={p.estado === 'aprobado' ? 'success' : p.estado === 'rechazado' ? 'error' : 'warning'}>
                      {p.estado ?? 'Pendiente'}
                    </StatusBadge>
                    <button
                      onClick={async () => {
                        if (selectedDetailId === p.id) {
                          setSelectedDetailId(null)
                          setDetailData(null)
                          setDetailError(null)
                          return
                        }
                        setSelectedDetailId(p.id)
                        setDetailLoading(true)
                        setDetailError(null)
                        setDetailData(null)
                        try {
                          const data = await getPedidoDetalle(p.id)
                          setDetailData(data)
                        } catch (err) {
                          setDetailError(err instanceof Error ? err.message : 'No se pudo cargar el detalle')
                        } finally {
                          setDetailLoading(false)
                        }
                      }}
                      className="inline-flex items-center gap-2 rounded-lg bg-white border border-red-100 px-3 py-1 text-sm text-red-600 hover:bg-red-50"
                    >
                      <Eye className="w-4 h-4" />
                      Ver detalle
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <PedidoDetalleModal
        open={!!selectedDetailId}
        data={detailData}
        onClose={() => { setSelectedDetailId(null); setDetailData(null); setDetailError(null); }}
      />

      <section className="rounded-xl border border-neutral-200 bg-white p-6">
        <h4 className="font-semibold text-neutral-950 mb-3">Estados del Pedido</h4>
        <div className="flex flex-wrap gap-3">
          <StatusBadge variant="warning">Pendiente Validación</StatusBadge>
          <StatusBadge variant="success">Aprobado por Bodega</StatusBadge>
          <StatusBadge variant="error">Rechazado</StatusBadge>
          <StatusBadge variant="info">Facturado</StatusBadge>
          <StatusBadge variant="neutral">En Ruta</StatusBadge>
        </div>
      </section>

      <section className="rounded-xl border border-blue-200 bg-blue-50 p-6">
        <h4 className="font-semibold text-blue-900 mb-2">Línea de Tiempo del Pedido</h4>
        <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
          <li>Pedido creado (por vendedor o cliente)</li>
          <li>Enviado a bodega para validación</li>
          <li>Bodega valida stock (aprueba o rechaza)</li>
          <li>ERP genera factura (si fue aprobado)</li>
          <li>Asignado a transportista</li>
          <li>En ruta de entrega</li>
          <li>Entregado al cliente</li>
        </ol>
      </section>
    </div>
  )
}


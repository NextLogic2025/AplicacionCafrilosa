import { PageHero } from '../../../../components/ui/PageHero'
import { ActionButton } from '../../../../components/ui/ActionButton'
import { StatusBadge } from '../../../../components/ui/StatusBadge'
import { EmptyContent } from '../../../../components/ui/EmptyContent'
import { RotateCcw, Search, CheckCircle } from 'lucide-react'

export default function VendedorDevoluciones() {
  return (
    <div className="space-y-6">
      <PageHero
        title="Devoluciones"
        subtitle="Gestión de solicitudes de devolución"
        chips={[
          { label: 'Autorización', variant: 'orange' },
          { label: 'Registro de motivos', variant: 'blue' },
        ]}
      />

      {/* Filtros */}
      <section className="rounded-xl border border-neutral-200 bg-white p-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Buscar Devolución
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <input
                type="text"
                placeholder="Número de pedido o cliente..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent"
              />
            </div>
          </div>

          <div className="w-48">
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Estado
            </label>
            <select className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent">
              <option value="">Todos</option>
              <option value="pendiente">Pendiente Autorización</option>
              <option value="autorizada">Autorizada</option>
              <option value="rechazada">Rechazada</option>
              <option value="procesada">Procesada</option>
            </select>
          </div>

          <div className="w-48">
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Cliente
            </label>
            <select className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent">
              <option value="">Todos mis clientes</option>
            </select>
          </div>
        </div>
      </section>

      {/* Lista de Devoluciones */}
      <section className="rounded-xl border border-neutral-200 bg-white p-6">
        <h3 className="text-lg font-bold text-neutral-950 mb-4">Solicitudes de Devolución</h3>
        <EmptyContent
          icon={<RotateCcw className="h-16 w-16" />}
          title="No hay solicitudes de devolución"
          description="Las solicitudes de devolución de tus clientes aparecerán aquí"
        />
      </section>

      {/* Leyenda de Estados */}
      <section className="rounded-xl border border-neutral-200 bg-white p-6">
        <h4 className="font-semibold text-neutral-950 mb-3">Estados de Devolución</h4>
        <div className="flex flex-wrap gap-3">
          <StatusBadge variant="warning">Pendiente Autorización</StatusBadge>
          <StatusBadge variant="success">Autorizada</StatusBadge>
          <StatusBadge variant="error">Rechazada</StatusBadge>
          <StatusBadge variant="info">Procesada por Bodega</StatusBadge>
        </div>
      </section>

      {/* Información */}
      <section className="rounded-xl border border-blue-200 bg-blue-50 p-6">
        <h4 className="font-semibold text-blue-900 mb-2">Gestión de Devoluciones</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>✓ Visualiza solicitudes de devolución de tus clientes</li>
          <li>✓ Autoriza o rechaza devoluciones</li>
          <li>✓ Registra el motivo de la devolución</li>
          <li>✓ Bodega procesa la devolución física una vez autorizada</li>
          <li>📌 Importante para la relación comercial con el cliente</li>
        </ul>
      </section>

      {/* Motivos Comunes */}
      <section className="rounded-xl border border-neutral-200 bg-white p-6">
        <h4 className="font-semibold text-neutral-950 mb-3">Motivos Comunes de Devolución</h4>
        <div className="flex flex-wrap gap-2 text-sm">
          <span className="px-3 py-1 rounded-full bg-neutral-100 text-neutral-700">Producto dañado</span>
          <span className="px-3 py-1 rounded-full bg-neutral-100 text-neutral-700">Error en pedido</span>
          <span className="px-3 py-1 rounded-full bg-neutral-100 text-neutral-700">Producto vencido</span>
          <span className="px-3 py-1 rounded-full bg-neutral-100 text-neutral-700">No solicitado</span>
          <span className="px-3 py-1 rounded-full bg-neutral-100 text-neutral-700">Otro</span>
        </div>
      </section>
    </div>
  )
}

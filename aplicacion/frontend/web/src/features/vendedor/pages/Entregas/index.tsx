import { PageHero } from '../../../../components/ui/PageHero'
import { StatusBadge } from '../../../../components/ui/StatusBadge'
import { EmptyContent } from '../../../../components/ui/EmptyContent'
import { Truck, Search } from 'lucide-react'

export default function VendedorEntregas() {
  return (
    <div className="space-y-6">
      <PageHero
        title="Entregas"
        subtitle="Seguimiento de despachos y entregas"
        chips={[
          { label: 'Solo lectura', variant: 'neutral' },
          { label: 'Seguimiento', variant: 'blue' },
        ]}
      />

      {/* Filtros */}
      <section className="rounded-xl border border-neutral-200 bg-white p-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Buscar Entrega
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
              <option value="preparacion">En Preparación</option>
              <option value="listo">Listo para Despacho</option>
              <option value="ruta">En Ruta</option>
              <option value="entregado">Entregado</option>
            </select>
          </div>

          <div className="w-48">
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Transportista
            </label>
            <select className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent">
              <option value="">Todos</option>
            </select>
          </div>
        </div>
      </section>

      {/* Lista de Entregas */}
      <section className="rounded-xl border border-neutral-200 bg-white p-6">
        <h3 className="text-lg font-bold text-neutral-950 mb-4">Estado de Despachos</h3>
        <EmptyContent
          icon={<Truck className="h-16 w-16" />}
          title="No hay entregas registradas"
          description="Las entregas asignadas a transportistas aparecerán aquí"
        />
      </section>

      {/* Leyenda de Estados */}
      <section className="rounded-xl border border-neutral-200 bg-white p-6">
        <h4 className="font-semibold text-neutral-950 mb-3">Estados de Entrega</h4>
        <div className="flex flex-wrap gap-3">
          <StatusBadge variant="warning">En Preparación</StatusBadge>
          <StatusBadge variant="info">Listo para Despacho</StatusBadge>
          <StatusBadge variant="neutral">En Ruta</StatusBadge>
          <StatusBadge variant="success">Entregado</StatusBadge>
        </div>
      </section>

      {/* Información */}
      <section className="rounded-xl border border-blue-200 bg-blue-50 p-6">
        <h4 className="font-semibold text-blue-900 mb-2">Seguimiento de Entregas</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>✓ Visualiza el estado de despachos de tus pedidos</li>
          <li>✓ Consulta qué transportista está asignado</li>
          <li>✓ Mantén informados a tus clientes sobre el estado</li>
          <li>✗ No puedes asignar transportistas (lo hace bodega/supervisor)</li>
          <li>📌 Útil para comunicación proactiva con clientes</li>
        </ul>
      </section>
    </div>
  )
}

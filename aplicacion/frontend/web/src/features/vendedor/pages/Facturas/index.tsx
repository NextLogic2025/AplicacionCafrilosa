import { PageHero } from '../../../../components/ui/PageHero'
import { StatusBadge } from '../../../../components/ui/StatusBadge'
import { EmptyContent } from '../../../../components/ui/EmptyContent'
import { CreditCard, Search } from 'lucide-react'

export default function VendedorFacturas() {
  return (
    <div className="space-y-6">
      <PageHero
        title="Facturas"
        subtitle="Consulta facturas de tus clientes"
        chips={[
          { label: 'Solo lectura', variant: 'neutral' },
          { label: 'Informativo', variant: 'blue' },
        ]}
      />

      {/* Filtros */}
      <section className="rounded-xl border border-neutral-200 bg-white p-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Buscar Factura
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <input
                type="text"
                placeholder="Número de factura o cliente..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent"
              />
            </div>
          </div>

          <div className="w-48">
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Cliente
            </label>
            <select className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent">
              <option value="">Todos mis clientes</option>
            </select>
          </div>

          <div className="w-48">
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Estado de Pago
            </label>
            <select className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent">
              <option value="">Todos</option>
              <option value="pendiente">Pendiente</option>
              <option value="pagada">Pagada</option>
              <option value="vencida">Vencida</option>
            </select>
          </div>
        </div>
      </section>

      {/* Lista de Facturas */}
      <section className="rounded-xl border border-neutral-200 bg-white p-6">
        <h3 className="text-lg font-bold text-neutral-950 mb-4">Facturas por Cliente</h3>
        <EmptyContent
          icon={<CreditCard className="h-16 w-16" />}
          title="No hay facturas disponibles"
          description="Las facturas generadas por el ERP aparecerán aquí"
        />
      </section>

      {/* Leyenda de Estados */}
      <section className="rounded-xl border border-neutral-200 bg-white p-6">
        <h4 className="font-semibold text-neutral-950 mb-3">Estados de Pago</h4>
        <div className="flex flex-wrap gap-3">
          <StatusBadge variant="warning">Pendiente</StatusBadge>
          <StatusBadge variant="success">Pagada</StatusBadge>
          <StatusBadge variant="error">Vencida</StatusBadge>
        </div>
      </section>

      {/* Información */}
      <section className="rounded-xl border border-orange-200 bg-orange-50 p-6">
        <h4 className="font-semibold text-orange-900 mb-2">Módulo Informativo</h4>
        <ul className="text-sm text-orange-800 space-y-1">
          <li>✓ Visualiza facturas de tus clientes</li>
          <li>✓ Consulta estado de pago</li>
          <li>✓ Descarga PDF de facturas</li>
          <li>✗ No puedes generar facturas (lo hace el ERP)</li>
          <li>✗ No puedes registrar pagos</li>
          <li>📌 Útil para seguimiento comercial y recordatorios de cobro</li>
        </ul>
      </section>
    </div>
  )
}

import { PageHero } from '../../../../components/ui/PageHero'
import { AlertCircle, TrendingUp, Users, Package, Calendar } from 'lucide-react'

export default function VendedorDashboard() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHero
        title="Panel de Vendedor"
        subtitle="Gestiona tu cartera de clientes y ventas"
        chips={[
          { label: 'Gestión comercial', variant: 'blue' },
          { label: 'Seguimiento de ventas', variant: 'green' },
        ]}
      />

      {/* KPIs Comerciales */}
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-neutral-200 bg-white p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-50 p-3">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-600">Pedidos del Día</p>
              <p className="text-2xl font-bold text-neutral-950">--</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-50 p-3">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-600">Ventas Acumuladas</p>
              <p className="text-2xl font-bold text-neutral-950">--</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-purple-50 p-3">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-600">Clientes Activos</p>
              <p className="text-2xl font-bold text-neutral-950">--</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-orange-50 p-3">
              <Calendar className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-600">Visitas Programadas</p>
              <p className="text-2xl font-bold text-neutral-950">--</p>
            </div>
          </div>
        </div>
      </section>

      {/* Alertas */}
      <section className="rounded-xl border border-orange-200 bg-orange-50 p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-orange-900">Alertas Comerciales</h3>
            <ul className="mt-2 space-y-1 text-sm text-orange-800">
              <li>• Pedidos rechazados por bodega: --</li>
              <li>• Facturas vencidas de clientes: --</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Agenda */}
      <section className="rounded-xl border border-neutral-200 bg-white p-6">
        <h3 className="text-lg font-bold text-neutral-950 mb-4">Agenda de Hoy</h3>
        <div className="text-center py-8 text-neutral-500">
          <Calendar className="h-12 w-12 mx-auto mb-3 text-neutral-400" />
          <p className="text-sm">No hay visitas programadas para hoy</p>
          <p className="text-xs text-neutral-400 mt-1">Los datos se cargarán desde el backend</p>
        </div>
      </section>
    </div>
  )
}

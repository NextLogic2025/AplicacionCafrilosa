import { PageHero } from '../../../../components/ui/PageHero'
import { EmptyContent } from '../../../../components/ui/EmptyContent'
import { BarChart3, TrendingUp, Target } from 'lucide-react'

export default function VendedorReportes() {
  return (
    <div className="space-y-6">
      <PageHero
        title="Reportes Comerciales"
        subtitle="Análisis de ventas y cumplimiento de metas"
        chips={[
          { label: 'Ventas por período', variant: 'blue' },
          { label: 'Metas personales', variant: 'green' },
        ]}
      />

      {/* Filtros */}
      <section className="rounded-xl border border-neutral-200 bg-white p-6">
        <div className="flex flex-wrap gap-4">
          <div className="w-48">
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Período
            </label>
            <select className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent">
              <option value="mes">Este mes</option>
              <option value="trimestre">Este trimestre</option>
              <option value="semestre">Este semestre</option>
              <option value="año">Este año</option>
              <option value="custom">Personalizado</option>
            </select>
          </div>

          <div className="w-48">
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Tipo de Reporte
            </label>
            <select className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent">
              <option value="ventas">Ventas</option>
              <option value="metas">Cumplimiento de Metas</option>
              <option value="clientes">Clientes Activos</option>
              <option value="productos">Productos Más Vendidos</option>
            </select>
          </div>
        </div>
      </section>

      {/* KPIs de Rendimiento */}
      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-neutral-200 bg-white p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="rounded-lg bg-green-50 p-3">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-600">Ventas del Período</p>
              <p className="text-2xl font-bold text-neutral-950">--</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="rounded-lg bg-blue-50 p-3">
              <Target className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-600">Meta del Mes</p>
              <p className="text-2xl font-bold text-neutral-950">--</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="rounded-lg bg-purple-50 p-3">
              <BarChart3 className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-600">% Cumplimiento</p>
              <p className="text-2xl font-bold text-neutral-950">--</p>
            </div>
          </div>
        </div>
      </section>

      {/* Gráficos */}
      <section className="rounded-xl border border-neutral-200 bg-white p-6">
        <h3 className="text-lg font-bold text-neutral-950 mb-4">Ventas por Período</h3>
        <EmptyContent
          icon={<BarChart3 className="h-16 w-16" />}
          title="No hay datos disponibles"
          description="Los reportes de ventas se generarán cuando tengas pedidos procesados"
        />
      </section>

      {/* Información */}
      <section className="rounded-xl border border-blue-200 bg-blue-50 p-6">
        <h4 className="font-semibold text-blue-900 mb-2">Reportes Disponibles</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>📊 Ventas por período (día, semana, mes, trimestre, año)</li>
          <li>🎯 Cumplimiento de metas personales</li>
          <li>👥 Clientes activos vs inactivos</li>
          <li>📦 Productos más vendidos de tu cartera</li>
          <li>📈 Tendencias de ventas por zona</li>
        </ul>
      </section>
    </div>
  )
}

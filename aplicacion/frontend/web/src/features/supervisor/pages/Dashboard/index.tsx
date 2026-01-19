import { BarChart3, Activity } from 'lucide-react'
import { SectionHeader } from 'components/ui/SectionHeader'
import { MetricCard, SectionCard } from 'components/ui/Cards'
import { PageHero } from 'components/ui/PageHero'

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <PageHero
        title="Control General"
        subtitle="Supervisa el desempeño operativo de toda la distribución comercial"
        chips={[
          'KPIs en tiempo real',
          'Alertas críticas',
          'Auditoría completa',
        ]}
      />

      <SectionHeader title="Dashboard Supervisión" subtitle="Métricas clave y estado operativo" />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Pedidos Hoy"
          value="24"
          change={+8}
          icon={<BarChart3 className="h-5 w-5" />}
        />
        <MetricCard
          label="En Validación"
          value="12"
          change={0}
          icon={<Activity className="h-5 w-5" />}
        />
        <MetricCard
          label="Entregas Pendientes"
          value="8"
          change={-2}
          icon={<BarChart3 className="h-5 w-5" />}
        />
        <MetricCard
          label="Alertas Activas"
          value="3"
          change={+1}
          icon={<Activity className="h-5 w-5" />}
        />
      </div>

      <SectionCard
        title="Indicadores de Riesgo"
        subtitle="Clientes y pedidos que requieren atención"
        content={
          <div className="space-y-3">
            <div className="rounded-lg bg-red-50 p-4 text-sm text-red-800">
              ⚠️ 2 clientes con crédito bloqueado
            </div>
            <div className="rounded-lg bg-yellow-50 p-4 text-sm text-yellow-800">
              ⚠️ 1 pedido retrasado en entrega
            </div>
            <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-800">
              ℹ️ 3 devoluciones pendientes de aprobación
            </div>
          </div>
        }
      />
    </div>
  )
}

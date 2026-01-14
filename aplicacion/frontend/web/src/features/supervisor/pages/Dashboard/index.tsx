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
          title="Pedidos Hoy"
          value="0"
          icon={<BarChart3 className="h-5 w-5" />}
        />
        <MetricCard
          title="En Validación"
          value="0"
          icon={<Activity className="h-5 w-5" />}
        />
        <MetricCard
          title="Entregas Pendientes"
          value="0"
          icon={<BarChart3 className="h-5 w-5" />}
        />
        <MetricCard
          title="Alertas Activas"
          value="0"
          icon={<Activity className="h-5 w-5" />}
        />
      </div>

      <SectionCard title="Indicadores de Riesgo">
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
      </SectionCard>
    </div>
  )
}

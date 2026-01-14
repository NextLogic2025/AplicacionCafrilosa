import { Package, Clock, Boxes, ListChecks, RefreshCw } from 'lucide-react'
import { SectionHeader } from 'components/ui/SectionHeader'
import { MetricCard, SectionCard, QuickActionButton, EmptyState } from 'components/ui/Cards'
import { PageHero } from 'components/ui/PageHero'

export default function DashboardPage() {
  return (
    <div className="space-y-5">
      <PageHero
        title="Operación de Bodega"
        subtitle="Valida stock, gestiona FEFO, prepara y despacha pedidos con trazabilidad completa."
        chips={[
          'Lotes y vencimientos',
          'Pedidos pendientes y preparación',
          'Control de inventario',
        ]}
      />

      <SectionHeader title="Dashboard Bodega" subtitle="Control general de inventario y operaciones" />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          title="Stock Total"
          value="0"
          subtitle="Unidades en bodega"
          icon={<Package className="h-5 w-5" />}
          tone="blue"
        />
        <MetricCard
          title="Productos Activos"
          value="0"
          subtitle="SKUs disponibles"
          icon={<Boxes className="h-5 w-5" />}
          tone="green"
        />
        <MetricCard
          title="Lotes Activos"
          value="0"
          subtitle="Lotes en inventario"
          icon={<ListChecks className="h-5 w-5" />}
          tone="gold"
        />
        <MetricCard
          title="Próximos a Vencer"
          value="0"
          subtitle="Requiere atención"
          icon={<Clock className="h-5 w-5" />}
          tone="gold"
        />
        <MetricCard
          title="Pedidos Pendientes"
          value="0"
          subtitle="Por preparar"
          icon={<Package className="h-5 w-5" />}
          tone="blue"
        />
        <MetricCard
          title="Lotes Vencidos"
          value="0"
          subtitle="Requiere eliminación"
          icon={<Clock className="h-5 w-5" />}
          tone="red"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Alertas Críticas">
          <EmptyState text="Sin datos disponibles" />
        </SectionCard>

        <SectionCard title="Accesos Rápidos">
          <div className="flex flex-wrap gap-2">
            <QuickActionButton
              label="Ver Inventario"
              icon={<Package className="h-4 w-4" />}
              onClick={() => window.location.href = '/bodeguero/inventario'}
            />
            <QuickActionButton
              label="Gestionar Lotes"
              icon={<RefreshCw className="h-4 w-4" />}
              onClick={() => window.location.href = '/bodeguero/lotes'}
            />
            <QuickActionButton
              label="Preparar Pedidos"
              icon={<ListChecks className="h-4 w-4" />}
              onClick={() => window.location.href = '/bodeguero/pedidos'}
            />
            <QuickActionButton
              label="Nueva Recepción"
              icon={<Boxes className="h-4 w-4" />}
              onClick={() => window.location.href = '/bodeguero/recepciones'}
            />
          </div>
        </SectionCard>
      </div>
    </div>
  )
}

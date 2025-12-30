import { Truck, Package, MapPin, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react'
import { SectionHeader } from 'components/ui/SectionHeader'
import { MetricCard, SectionCard, QuickActionButton, EmptyState } from 'components/ui/Cards'
import { PageHero } from 'components/ui/PageHero'

export default function InicioPage() {
  return (
    <div className="space-y-5">
      <PageHero
        title="Sistema de Distribución Comercial (Logística)"
        subtitle="Gestiona entregas, rutas y devoluciones. Registra evidencia y garantiza la última milla del proceso comercial."
        chips={[
          'Pedidos asignados y entregas',
          'Rutas optimizadas',
          'Evidencia trazable (firma y foto)',
        ]}
      />

      <SectionHeader title="Dashboard Logístico" subtitle="Control operativo de entregas y rutas" />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          title="Pedidos Asignados Hoy"
          value="0"
          subtitle="Listos para retiro"
          icon={<Package className="h-5 w-5" />}
          tone="blue"
        />
        <MetricCard
          title="Entregas Pendientes"
          value="0"
          subtitle="En ruta o sin iniciar"
          icon={<Truck className="h-5 w-5" />}
          tone="gold"
        />
        <MetricCard
          title="Entregas Completadas"
          value="0"
          subtitle="Entregadas hoy"
          icon={<CheckCircle className="h-5 w-5" />}
          tone="green"
        />
        <MetricCard
          title="Devoluciones Asignadas"
          value="0"
          subtitle="Por retirar"
          icon={<RefreshCw className="h-5 w-5" />}
          tone="gold"
        />
        <MetricCard
          title="Rutas Activas"
          value="0"
          subtitle="En curso"
          icon={<MapPin className="h-5 w-5" />}
          tone="blue"
        />
        <MetricCard
          title="Alertas"
          value="0"
          subtitle="Requiere atención"
          icon={<AlertCircle className="h-5 w-5" />}
          tone="red"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Alertas Operativas">
          <EmptyState text="Sin alertas pendientes" />
        </SectionCard>

        <SectionCard title="Accesos Rápidos">
          <div className="flex flex-wrap gap-2">
            <QuickActionButton
              label="Ver Pedidos Asignados"
              icon={<Package className="h-4 w-4" />}
              onClick={() => window.location.href = '/transportista/pedidos'}
            />
            <QuickActionButton
              label="Mis Rutas"
              icon={<MapPin className="h-4 w-4" />}
              onClick={() => window.location.href = '/transportista/rutas'}
            />
            <QuickActionButton
              label="Registrar Entrega"
              icon={<CheckCircle className="h-4 w-4" />}
              onClick={() => window.location.href = '/transportista/entregas'}
            />
            <QuickActionButton
              label="Ver Historial"
              icon={<Truck className="h-4 w-4" />}
              onClick={() => window.location.href = '/transportista/historial'}
            />
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Actividad Reciente">
        <EmptyState text="Sin actividad registrada" />
      </SectionCard>
    </div>
  )
}

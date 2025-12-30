import { SectionHeader } from 'components/ui/SectionHeader'
import { EmptyContent } from 'components/ui/EmptyContent'
import { Bell } from 'lucide-react'
import { PageHero } from 'components/ui/PageHero'

export default function NotificacionesBodegaPage() {
  return (
    <div className="space-y-5">
      <PageHero
        title="Notificaciones"
        subtitle="Alertas operacionales de bodega, pedidos y devoluciones"
        chips={[
          'Alertas de stock bajo',
          'Vencimientos próximos',
          'Pedidos listos',
        ]}
      />

      <SectionHeader title="Notificaciones" subtitle="Alertas operativas y avisos de bodega" />
      <EmptyContent icon={Bell} title="Sin notificaciones" subtitle="Aquí verás nuevos pedidos, aprobaciones/rechazos y lotes por vencer." />
    </div>
  )
}

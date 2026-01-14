import { Bell } from 'lucide-react'
import { SectionHeader } from 'components/ui/SectionHeader'
import { Alert } from 'components/ui/Alert'
import { EmptyContent } from 'components/ui/EmptyContent'
import { PageHero } from 'components/ui/PageHero'

export default function NotificacionesPage() {
  return (
    <div className="space-y-6">
      <PageHero
        title="Notificaciones"
        subtitle="Alertas operativas: pedidos listos, cambios de ruta y nuevas devoluciones"
        chips={[
          'Pedidos listos',
          'Cambios de ruta',
          'Nuevas devoluciones',
        ]}
      />

      <SectionHeader 
        title="Notificaciones" 
        subtitle="Alertas operativas y cambios de ruta" 
      />

      <Alert
        type="info"
        title="Sin datos aún"
        message="Vista preparada para mostrar notificaciones de pedidos listos, cambios de ruta, y nuevas devoluciones (sin datos quemados)."
      />

      <EmptyContent
        icon={Bell}
        title="No hay notificaciones"
        subtitle="Recibirás alertas sobre pedidos listos, cambios de ruta y asignaciones."
      />
    </div>
  )
}

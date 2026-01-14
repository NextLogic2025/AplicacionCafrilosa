import { RotateCcw } from 'lucide-react'
import { SectionHeader } from 'components/ui/SectionHeader'
import { EmptyContent } from 'components/ui/EmptyContent'
import { PageHero } from 'components/ui/PageHero'

export default function DevolucionesPage() {
  return (
    <div className="space-y-6">
      <PageHero
        title="Gestión de Devoluciones"
        subtitle="Solicitudes de devolución, aprobaciones y retiros autorizados"
        chips={[
          'Solicitudes pendientes',
          'Aprobar / rechazar',
          'Autorizar retiros',
        ]}
      />

      <SectionHeader
        title="Devoluciones"
        subtitle="Solicitudes y autorizaciones"
      />

      <EmptyContent
        icon={RotateCcw}
        title="Sin datos aún"
        subtitle="Vista preparada para mostrar solicitudes de devolución y su estado (sin datos quemados)."
      />
    </div>
  )
}

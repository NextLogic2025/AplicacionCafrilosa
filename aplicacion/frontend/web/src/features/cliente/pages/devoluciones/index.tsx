import { SectionHeader } from 'components/ui/SectionHeader'
import { Alert } from 'components/ui/Alert'
import { EmptyContent } from 'components/ui/EmptyContent'
import { PageHero } from 'components/ui/PageHero'
import { RotateCcw } from 'lucide-react'

export default function PaginaDevoluciones() {
  return (
    <div className="space-y-6">
      <PageHero
        title="Devoluciones"
        subtitle="Solicita devoluciones, consulta estados y gestiona procesos de cambio"
        chips={[
          'Solicitar devolución',
          'Estado del cambio',
          'Historial de devoluciones',
        ]}
      />

      <SectionHeader title="Devoluciones" subtitle="Estructura de consulta (solo lectura)" />

      <Alert
        type="info"
        title="Diseño intencional"
        message="Las devoluciones son gestionadas por el Vendedor. El Cliente solo consulta el estado (sin datos quemados)."
      />

      <EmptyContent
        icon={RotateCcw}
        title="No hay devoluciones registradas"
        subtitle="Cuando el flujo esté activo, se listarán aquí."
      />
    </div>
  )
}

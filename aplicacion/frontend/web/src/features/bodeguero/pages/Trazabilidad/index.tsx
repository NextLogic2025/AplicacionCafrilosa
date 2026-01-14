import { FileText } from 'lucide-react'
import { SectionHeader } from 'components/ui/SectionHeader'
import { EmptyContent } from 'components/ui/EmptyContent'
import { PageHero } from 'components/ui/PageHero'

export default function TrazabilidadPage() {
  return (
    <div className="space-y-6">
      <PageHero
        title="Trazabilidad de Productos"
        subtitle="Consulta el historial completo de movimientos de cualquier producto"
        chips={[
          'Auditoría de movimientos',
          'Trazado por producto',
          'Reportes de movimiento',
        ]}
      />

      <SectionHeader
        title="Trazabilidad"
        subtitle="Historial completo de movimientos de producto"
      />

      <EmptyContent
        icon={FileText}
        title="Sin datos de trazabilidad"
        subtitle="Los movimientos aparecerán aquí cuando se conecte el backend"
      />
    </div>
  )
}

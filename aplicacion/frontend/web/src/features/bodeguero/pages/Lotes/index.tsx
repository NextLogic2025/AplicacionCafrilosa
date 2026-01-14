import { Package } from 'lucide-react'
import { SectionHeader } from 'components/ui/SectionHeader'
import { EmptyContent } from 'components/ui/EmptyContent'
import { PageHero } from 'components/ui/PageHero'

export default function LotesPage() {
  return (
    <div className="space-y-6">
      <PageHero
        title="Gestión de Lotes"
        subtitle="Controla vencimientos, FEFO y movimiento de lotes por fecha de expiración"
        chips={[
          'FEFO (First Expired First Out)',
          'Alertas de vencimiento',
          'Trazabilidad por lote',
        ]}
      />

      <SectionHeader
        title="Gestión de Lotes (FEFO)"
        subtitle="Control de lotes y fechas de caducidad"
      />

      <EmptyContent
        icon={Package}
        title="No hay lotes registrados"
        subtitle="Los lotes aparecerán aquí cuando se conecte el backend"
      />
    </div>
  )
}
 
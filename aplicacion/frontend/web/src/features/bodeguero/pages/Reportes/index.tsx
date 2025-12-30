import { BarChart3 } from 'lucide-react'
import { SectionHeader } from 'components/ui/SectionHeader'
import { EmptyContent } from 'components/ui/EmptyContent'
import { PageHero } from 'components/ui/PageHero'

export default function ReportesPage() {
  return (
    <div className="space-y-6">
      <PageHero
        title="Reportes Operacionales"
        subtitle="Genera reportes de inventario, movimientos y desempeño"
        chips={[
          'Reportes de stock',
          'Análisis de movimientos',
          'KPIs operacionales',
        ]}
      />

      <SectionHeader title="Reportes" subtitle="Generación de informes de inventario" />

      <EmptyContent
        icon={BarChart3}
        title="Sin reportes disponibles"
        subtitle="Los reportes estarán disponibles cuando se conecte el backend"
      />
    </div>
  )
}
 
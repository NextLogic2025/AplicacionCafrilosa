import { BarChart3 } from 'lucide-react'
import { SectionHeader } from 'components/ui/SectionHeader'
import { EmptyContent } from 'components/ui/EmptyContent'
import { PageHero } from 'components/ui/PageHero'

export default function ReportesPage() {
  return (
    <div className="space-y-6">
      <PageHero
        title="Reportes Analíticos"
        subtitle="Análisis por cliente, vendedor, zona y producto - Exportables para gerencia"
        chips={[
          'Reportes ejecutivos',
          'Análisis por zona',
          'Exportar datos',
        ]}
      />

      <SectionHeader
        title="Reportes"
        subtitle="Generación de informes operacionales"
      />

      <EmptyContent
        icon={BarChart3}
        title="Sin datos aún"
        subtitle="Vista preparada para mostrar reportes por cliente, vendedor, zona y producto (sin datos quemados)."
      />
    </div>
  )
}

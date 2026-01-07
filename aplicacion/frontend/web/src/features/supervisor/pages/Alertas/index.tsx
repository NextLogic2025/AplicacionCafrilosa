import { AlertCircle } from 'lucide-react'
import { SectionHeader } from 'components/ui/SectionHeader'
import { EmptyContent } from 'components/ui/EmptyContent'
import { PageHero } from 'components/ui/PageHero'

export default function AlertasPage() {
  return (
    <div className="space-y-6">
      <PageHero
        title="Centro de Alertas"
        subtitle="Eventos críticos del sistema: bloqueos, incidencias y retrasos"
        chips={[
          'Pedidos bloqueados',
          'Clientes con incidencias',
          'Retrasos logísticos',
        ]}
      />

      <SectionHeader
        title="Alertas"
        subtitle="Eventos críticos que requieren atención"
      />

      <EmptyContent
        icon={AlertCircle}
        title="Sin datos aún"
        subtitle="Vista preparada para mostrar alertas críticas del sistema (sin datos quemados)."
      />
    </div>
  )
}

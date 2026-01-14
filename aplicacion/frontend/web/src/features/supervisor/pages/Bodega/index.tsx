import { Package } from 'lucide-react'
import { SectionHeader } from 'components/ui/SectionHeader'
import { EmptyContent } from 'components/ui/EmptyContent'
import { PageHero } from 'components/ui/PageHero'

export default function BodegaPage() {
  return (
    <div className="space-y-6">
      <PageHero
        title="Control de Bodega"
        subtitle="Auditoria de validación de stock y tiempos de preparación"
        chips={[
          'Pedidos pendientes',
          'Tiempos de preparación',
          'Cuellos de botella',
        ]}
      />

      <SectionHeader
        title="Estado de Bodega"
        subtitle="Validaciones de stock y preparación de pedidos"
      />

      <EmptyContent
        icon={Package}
        title="Sin datos aún"
        subtitle="Vista preparada para mostrar estado de validación de stock y pedidos en preparación (sin datos quemados)."
      />
    </div>
  )
}

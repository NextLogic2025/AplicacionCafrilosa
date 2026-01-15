import { ClipboardList } from 'lucide-react'
import { SectionHeader } from 'components/ui/SectionHeader'
import { EmptyContent } from 'components/ui/EmptyContent'
import { PageHero } from 'components/ui/PageHero'

export default function PedidosPage() {
  return (
    <div className="space-y-6">
      <PageHero
        title="Trazabilidad de Pedidos"
        subtitle="Línea de tiempo completa: creación, validación, facturación y entrega"
        chips={[
          'Estado de pedidos',
          'Historial completo',
          'Escalar incidencias',
        ]}
      />

      <SectionHeader
        title="Pedidos del Sistema"
        subtitle="Todos los pedidos con su trazabilidad completa"
      />

      <EmptyContent
        icon={ClipboardList}
        title="Sin datos aún"
        subtitle="Vista preparada para mostrar todos los pedidos, estados y línea de tiempo (sin datos quemados)."
      />
    </div>
  )
}

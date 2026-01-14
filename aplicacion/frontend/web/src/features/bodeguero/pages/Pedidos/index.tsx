import { useState } from 'react'
import { Eye, ClipboardCheck } from 'lucide-react'
import { SectionHeader } from 'components/ui/SectionHeader'
import { EmptyContent } from 'components/ui/EmptyContent'
import { Badge } from 'components/ui/Badge'
import { PageHero } from 'components/ui/PageHero'

export default function PedidosPage() {
  const [pedidos] = useState([])

  return (
    <div className="space-y-6">
      <PageHero
        title="Pedidos en Bodega"
        subtitle="Consulta y prepara los pedidos aprobados para despacho"
        chips={[
          'Estado de preparación',
          'Picking y packing',
          'Control de calidad',
        ]}
      />

      <SectionHeader
        title="Pedidos a Preparar"
        subtitle="Pedidos aprobados listos para preparación (FEFO)"
      />

      <EmptyContent
        icon={ClipboardCheck}
        title="No hay pedidos pendientes"
        subtitle="Los pedidos aprobados aparecerán aquí para su preparación"
      />
    </div>
  )
}

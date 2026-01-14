import { Truck } from 'lucide-react'
import { SectionHeader } from 'components/ui/SectionHeader'
import { EmptyContent } from 'components/ui/EmptyContent'
import { PageHero } from 'components/ui/PageHero'

export default function DespachosPage() {
  return (
    <div className="space-y-6">
      <PageHero
        title="Despachos"
        subtitle="Gestiona la salida de mercadería hacia el transporte y clientes"
        chips={[
          'Generación de guías',
          'Asignación a transportistas',
          'Tracking de envíos',
        ]}
      />

      <SectionHeader
        title="Despachos"
        subtitle="Control de salidas de mercadería"
      />

      <EmptyContent
        icon={Truck}
        title="No hay despachos registrados"
        subtitle="Los despachos aparecerán aquí cuando se conecte el backend"
      />
    </div>
  )
}

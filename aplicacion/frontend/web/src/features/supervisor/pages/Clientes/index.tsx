import { Users } from 'lucide-react'
import { SectionHeader } from 'components/ui/SectionHeader'
import { EmptyContent } from 'components/ui/EmptyContent'
import { PageHero } from 'components/ui/PageHero'

export default function ClientesPage() {
  return (
    <div className="space-y-6">
      <PageHero
        title="Gestión de Clientes"
        subtitle="Monitorea clientes, estado de crédito e historial de incidencias"
        chips={[
          'Estado de clientes',
          'Control de crédito',
          'Historial de pedidos',
        ]}
      />

      <SectionHeader
        title="Clientes"
        subtitle="Listado de clientes activos e incidencias"
      />

      <EmptyContent
        icon={Users}
        title="Sin datos aún"
        subtitle="Vista preparada para mostrar clientes, vendedor asignado y zona (sin datos quemados)."
      />
    </div>
  )
}

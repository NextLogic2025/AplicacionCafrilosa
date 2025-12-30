import { Users, UserPlus } from 'lucide-react'
import { SectionHeader } from 'components/ui/SectionHeader'
import { EmptyContent } from 'components/ui/EmptyContent'
import { PageHero } from 'components/ui/PageHero'
import { Button } from 'components/ui/Button'

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

      <div className="flex justify-end">
        <Button className="flex items-center gap-2 bg-brand-red text-white hover:bg-brand-red/90">
          <UserPlus className="h-4 w-4" />
          Crear usuario cliente
        </Button>
      </div>

      <EmptyContent
        icon={Users}
        title="Sin datos aún"
        subtitle="Vista preparada para mostrar clientes, vendedor asignado y zona (sin datos quemados)."
      />
    </div>
  )
}

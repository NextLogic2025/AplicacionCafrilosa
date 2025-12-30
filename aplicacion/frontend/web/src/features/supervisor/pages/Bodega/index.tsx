import { Package, UserPlus } from 'lucide-react'
import { SectionHeader } from 'components/ui/SectionHeader'
import { EmptyContent } from 'components/ui/EmptyContent'
import { PageHero } from 'components/ui/PageHero'
import { Button } from 'components/ui/Button'

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

      <div className="flex justify-end">
        <Button className="flex items-center gap-2 bg-brand-red text-white hover:bg-brand-red/90">
          <UserPlus className="h-4 w-4" />
          Crear usuario bodega
        </Button>
      </div>

      <EmptyContent
        icon={Package}
        title="Sin datos aún"
        subtitle="Vista preparada para mostrar estado de validación de stock y pedidos en preparación (sin datos quemados)."
      />
    </div>
  )
}

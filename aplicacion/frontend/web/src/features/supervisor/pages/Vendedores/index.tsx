import { TrendingUp, UserPlus } from 'lucide-react'
import { SectionHeader } from 'components/ui/SectionHeader'
import { EmptyContent } from 'components/ui/EmptyContent'
import { PageHero } from 'components/ui/PageHero'
import { Button } from 'components/ui/Button'

export default function VendedoresPage() {
  return (
    <div className="space-y-6">
      <PageHero
        title="Monitoreo de Vendedores"
        subtitle="KPIs de vendedores, zonas asignadas y desempeño individual"
        chips={[
          'Pedidos creados',
          'Ventas efectivas',
          'Desempeño individual',
        ]}
      />

      <SectionHeader
        title="Vendedores"
        subtitle="Rendimiento y zonas de cobertura"
      />

      <div className="flex justify-end">
        <Button className="flex items-center gap-2 bg-brand-red text-white hover:bg-brand-red/90">
          <UserPlus className="h-4 w-4" />
          Crear usuario vendedor
        </Button>
      </div>

      <EmptyContent
        icon={TrendingUp}
        title="Sin datos aún"
        subtitle="Vista preparada para mostrar vendedores activos, KPIs y zonas asignadas (sin datos quemados)."
      />
    </div>
  )
}

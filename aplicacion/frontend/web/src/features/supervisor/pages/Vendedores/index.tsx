import { TrendingUp } from 'lucide-react'
import { SectionHeader } from 'components/ui/SectionHeader'
import { EmptyContent } from 'components/ui/EmptyContent'
import { PageHero } from 'components/ui/PageHero'

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

      <EmptyContent
        icon={TrendingUp}
        title="Sin datos aún"
        subtitle="Vista preparada para mostrar vendedores activos, KPIs y zonas asignadas (sin datos quemados)."
      />
    </div>
  )
}

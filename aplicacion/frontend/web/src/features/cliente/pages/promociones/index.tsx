import { Percent } from 'lucide-react'
import { SectionHeader } from 'components/ui/SectionHeader'
import { Alert } from 'components/ui/Alert'
import { EmptyContent } from 'components/ui/EmptyContent'
import { PageHero } from 'components/ui/PageHero'

export default function PaginaPromociones() {
  return (
    <div className="space-y-6">
      <PageHero
        title="Promociones y Ofertas"
        subtitle="Descubre nuestras mejores ofertas y promociones vigentes"
        chips={[
          'Descuentos especiales',
          'Ofertas por volumen',
          'Promociones por categoría',
        ]}
      />

      <SectionHeader title="Promociones" subtitle="Estructura preparada para catálogos y ofertas" />

      <Alert
        type="info"
        title="Sin datos aún"
        message="Esta vista está lista para integrarse con el ERP de promociones (sin datos quemados)."
      />

      <EmptyContent
        icon={Percent}
        title="No hay promociones activas"
        subtitle="Cuando el servicio esté disponible, se mostrarán aquí."
      />
    </div>
  )
}

import { Truck } from 'lucide-react'
import { SectionHeader } from 'components/ui/SectionHeader'
import { EmptyContent } from 'components/ui/EmptyContent'
import { PageHero } from 'components/ui/PageHero'

export default function EntregasPage() {
  return (
    <div className="space-y-6">
      <PageHero
        title="Supervisión de Entregas"
        subtitle="Entregas en ruta, entregadas y fallidas con evidencia completa"
        chips={[
          'En ruta y entregadas',
          'Entregas fallidas',
          'Validar evidencia',
        ]}
      />

      <SectionHeader
        title="Entregas"
        subtitle="Estado logístico y reasignaciones"
      />

      <EmptyContent
        icon={Truck}
        title="Sin datos aún"
        subtitle="Vista preparada para mostrar entregas por transportista, estado y evidencia (sin datos quemados)."
      />
    </div>
  )
}

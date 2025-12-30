import { MapPin } from 'lucide-react'
import { SectionHeader } from 'components/ui/SectionHeader'
import { Alert } from 'components/ui/Alert'
import { EmptyContent } from 'components/ui/EmptyContent'
import { PageHero } from 'components/ui/PageHero'

export default function RutasPage() {
  return (
    <div className="space-y-6">
      <PageHero
        title="Rutas"
        subtitle="Rutas optimizadas y orden de entregas para maximizar eficiencia"
        chips={[
          'Optimización de ruta',
          'Orden de entregas',
          'Historial de rutas',
        ]}
      />

      <SectionHeader 
        title="Rutas" 
        subtitle="Rutas asignadas y orden de entregas" 
      />

      <Alert
        type="info"
        title="Sin datos aún"
        message="Vista preparada para mostrar rutas optimizadas (sin datos quemados)."
      />

      <EmptyContent
        icon={MapPin}
        title="No hay rutas asignadas"
        subtitle="Cuando tengas rutas activas, se mostrarán aquí con orden sugerido."
      />
    </div>
  )
}

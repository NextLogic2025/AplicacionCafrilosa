import { PageHero } from 'components/ui/PageHero'
import { SectionHeader } from 'components/ui/SectionHeader'
import { Alert } from 'components/ui/Alert'

export default function RutasPage() {
  return (
    <div className="space-y-6">
      <PageHero
        title="Rutas"
        subtitle="Planifica y gestiona las rutas de distribución"
        chips={["Logística", "Rutas", "Cobertura"]}
      />

      <SectionHeader
        title="Configuración de rutas"
        subtitle="Define zonas, puntos de entrega y asignaciones a transportistas"
      />

      <Alert
        type="info"
        message="Aún no hay configuración de rutas. Cuando esté disponible podrás administrar zonas y asignar rutas a tu equipo de transporte."
      />
    </div>
  )
}

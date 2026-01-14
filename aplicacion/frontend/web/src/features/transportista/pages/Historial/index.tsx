import { Calendar } from 'lucide-react'
import { SectionHeader } from 'components/ui/SectionHeader'
import { Alert } from 'components/ui/Alert'
import { EmptyContent } from 'components/ui/EmptyContent'
import { PageHero } from 'components/ui/PageHero'

export default function HistorialPage() {
  return (
    <div className="space-y-6">
      <PageHero
        title="Historial"
        subtitle="Consulta todas tus entregas y devoluciones completadas"
        chips={[
          'Entregas completadas',
          'Devoluciones procesadas',
          'Estadísticas personales',
        ]}
      />

      <SectionHeader 
        title="Historial" 
        subtitle="Entregas y devoluciones completadas" 
      />

      <Alert
        type="info"
        title="Sin datos aún"
        message="Vista preparada para mostrar historial completo de entregas y devoluciones (sin datos quemados)."
      />

      <EmptyContent
        icon={Calendar}
        title="Sin historial registrado"
        subtitle="Una vez realices entregas, se registrarán aquí con fecha y estado."
      />
    </div>
  )
}

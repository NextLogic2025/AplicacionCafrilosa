import { Truck } from 'lucide-react'
import { SectionHeader } from 'components/ui/SectionHeader'
import { Alert } from 'components/ui/Alert'
import { EmptyContent } from 'components/ui/EmptyContent'
import { PageHero } from 'components/ui/PageHero'

export default function EntregasPage() {
  return (
    <div className="space-y-6">
      <PageHero
        title="Entregas"
        subtitle="Módulo central: registra entregas, firma digital y evidencia fotográfica"
        chips={[
          'Confirmación de entrega',
          'Firma digital',
          'Evidencia fotográfica',
        ]}
      />

      <SectionHeader 
        title="Entregas" 
        subtitle="Registro de entregas y evidencia" 
      />

      <Alert
        type="info"
        title="Módulo central del transportista"
        message="Aquí confirmarás entregas, registrarás firma digital, fotografías y observaciones (sin datos quemados)."
      />

      <EmptyContent
        icon={Truck}
        title="No hay entregas pendientes"
        subtitle="Cuando tengas entregas por realizar, se listarán aquí con detalle completo."
      />
    </div>
  )
}

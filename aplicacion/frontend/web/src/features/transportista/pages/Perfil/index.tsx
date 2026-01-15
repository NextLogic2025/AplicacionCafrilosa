import { User } from 'lucide-react'
import { SectionHeader } from 'components/ui/SectionHeader'
import { Alert } from 'components/ui/Alert'
import { EmptyContent } from 'components/ui/EmptyContent'
import { PageHero } from 'components/ui/PageHero'

export default function PerfilPage() {
  return (
    <div className="space-y-6">
      <PageHero
        title="Mi Perfil"
        subtitle="Administra tus datos personales, vehículo asignado y zona de reparto"
        chips={[
          'Datos personales',
          'Vehículo asignado',
          'Zona de reparto',
        ]}
      />

      <SectionHeader 
        title="Mi Perfil" 
        subtitle="Datos personales y vehículo asignado" 
      />

      <Alert
        type="info"
        title="Sin datos aún"
        message="Vista preparada para mostrar datos personales, vehículo asignado y zona de reparto (sin datos quemados)."
      />

      <EmptyContent
        icon={User}
        title="Perfil no configurado"
        subtitle="Tus datos personales y asignación de vehículo se mostrarán aquí."
      />
    </div>
  )
}

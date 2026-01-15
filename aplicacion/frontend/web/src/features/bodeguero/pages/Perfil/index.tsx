import { User } from 'lucide-react'
import { SectionHeader } from 'components/ui/SectionHeader'
import { EmptyContent } from 'components/ui/EmptyContent'
import { PageHero } from 'components/ui/PageHero'

export default function PerfilPage() {
  return (
    <div className="space-y-6">
      <PageHero
        title="Mi Perfil"
        subtitle="Administra tu información personal y preferencias de bodeguero"
        chips={[
          'Datos personales',
          'Zona de operación',
          'Historial laboral',
        ]}
      />

      <SectionHeader title="Mi Perfil" subtitle="Información personal y configuración" />

      <EmptyContent
        icon={User}
        title="Información del perfil"
        subtitle="Los datos del perfil aparecerán aquí cuando se conecte el backend"
      />
    </div>
  )
}

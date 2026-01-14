import { User } from 'lucide-react'
import { SectionHeader } from 'components/ui/SectionHeader'
import { EmptyContent } from 'components/ui/EmptyContent'
import { PageHero } from 'components/ui/PageHero'

export default function PerfilPage() {
  return (
    <div className="space-y-6">
      <PageHero
        title="Mi Perfil"
        subtitle="Datos personales y zona de supervisión asignada"
        chips={[
          'Datos personales',
          'Zona de supervisión',
          'Permisos asignados',
        ]}
      />

      <SectionHeader
        title="Mi Perfil"
        subtitle="Información personal del supervisor"
      />

      <EmptyContent
        icon={User}
        title="Sin datos aún"
        subtitle="Vista preparada para mostrar datos personales y zona de supervisión (sin datos quemados)."
      />
    </div>
  )
}

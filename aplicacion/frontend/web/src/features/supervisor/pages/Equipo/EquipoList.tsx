import { Users } from 'lucide-react'
import { EmptyContent } from 'components/ui/EmptyContent'
import { LoadingSpinner } from 'components/ui/LoadingSpinner'
import { type Usuario } from '../../services/usuariosApi'
import { UsuarioCard } from './UsuarioCard'

interface EquipoListProps {
  usuarios: Usuario[]
  isLoading: boolean
}

export function EquipoList({ usuarios, isLoading }: EquipoListProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    )
  }

  if (usuarios.length === 0) {
    return (
      <EmptyContent
        icon={Users}
        title="No hay usuarios en el equipo"
        subtitle="Comienza creando el primer miembro del equipo usando el botón de arriba."
      />
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {usuarios.map((usuario) => (
        <UsuarioCard key={usuario.id} usuario={usuario} />
      ))}
    </div>
  )
}

import { Building2 } from 'lucide-react'
import { EmptyContent } from 'components/ui/EmptyContent'
import { LoadingSpinner } from 'components/ui/LoadingSpinner'
import { type Cliente } from '../../services/clientesApi'
import { ClienteCard } from './ClienteCard'

interface ClienteListProps {
  clientes: Cliente[]
  isLoading: boolean
}

export function ClienteList({ clientes, isLoading }: ClienteListProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    )
  }

  if (clientes.length === 0) {
    return (
      <EmptyContent
        icon={Building2}
        title="No hay clientes registrados"
        subtitle="Comienza creando tu primer cliente usando el botón de arriba."
      />
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {clientes.map((cliente) => (
        <ClienteCard key={cliente.id} cliente={cliente} />
      ))}
    </div>
  )
}

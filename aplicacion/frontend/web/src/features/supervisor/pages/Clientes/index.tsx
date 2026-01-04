import { Users, UserPlus } from 'lucide-react'
import { SectionHeader } from 'components/ui/SectionHeader'
import { PageHero } from 'components/ui/PageHero'
import { Button } from 'components/ui/Button'
import { useState, useEffect } from 'react'
import { obtenerClientes, type Cliente } from '../../services/clientesApi'
import { ClienteList } from './ClienteList'
import { CrearClienteModal } from './CrearClienteModal'

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    cargarClientes()
  }, [])

  const cargarClientes = async () => {
    try {
      setIsLoading(true)
      const data = await obtenerClientes()
      setClientes(data)
    } catch (error) {
      console.error('Error al cargar clientes:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenModal = () => {
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
  }

  const handleSuccessCreate = () => {
    cargarClientes()
  }

  return (
    <div className="space-y-6">
      <PageHero
        title="Gestión de Clientes"
        subtitle="Monitorea clientes, estado de crédito e historial de incidencias"
        chips={['Estado de clientes', 'Control de crédito', 'Historial de pedidos']}
      />

      <SectionHeader
        title="Clientes"
        subtitle="Listado de clientes activos e incidencias"
      />

      <div className="flex justify-end">
        <Button
          onClick={handleOpenModal}
          className="flex items-center gap-2 bg-brand-red text-white hover:bg-brand-red/90"
        >
          <UserPlus className="h-4 w-4" />
          Crear cliente
        </Button>
      </div>

      <ClienteList clientes={clientes} isLoading={isLoading} />

      <CrearClienteModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSuccess={handleSuccessCreate}
      />
    </div>
  )
}

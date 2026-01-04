import { Users, UserPlus } from 'lucide-react'
import { SectionHeader } from 'components/ui/SectionHeader'
import { PageHero } from 'components/ui/PageHero'
import { Button } from 'components/ui/Button'
import { useState, useEffect } from 'react'
import { obtenerClientes, eliminarCliente, obtenerZonas, obtenerListasPrecios, type Cliente, type ZonaComercial, type ListaPrecio } from '../../services/clientesApi'
import { ClienteList } from './ClienteList'
import { CrearClienteModal } from './CrearClienteModal'

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null)
  const [zonas, setZonas] = useState<ZonaComercial[]>([])
  const [listasPrecios, setListasPrecios] = useState<ListaPrecio[]>([])

  useEffect(() => {
    cargarClientes()
    cargarCatalogos()
  }, [])

  const cargarCatalogos = async () => {
    try {
      const [zonasData, listasData] = await Promise.all([
        obtenerZonas().catch(() => []),
        obtenerListasPrecios().catch(() => []),
      ])
      setZonas(zonasData)
      setListasPrecios(listasData)
    } catch (error) {
      console.error('Error al cargar catálogos:', error)
    }
  }

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
    setEditingCliente(null)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingCliente(null)
  }

  const handleSuccessCreate = () => {
    cargarClientes()
  }

  const handleEdit = (cliente: Cliente) => {
    setEditingCliente(cliente)
    setIsModalOpen(true)
  }

  const handleDelete = async (cliente: Cliente) => {
    if (!confirm(`¿Eliminar cliente ${cliente.razon_social}?`)) return
    try {
      await eliminarCliente(cliente.id)
      await cargarClientes()
    } catch (error) {
      console.error('Error al eliminar cliente:', error)
      alert('No se pudo eliminar el cliente')
    }
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

      <ClienteList
        clientes={clientes}
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        zonas={zonas}
        listasPrecios={listasPrecios}
      />

      <CrearClienteModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSuccess={handleSuccessCreate}
        initialData={editingCliente ? { ...editingCliente, nombre_comercial: editingCliente.nombre_comercial || undefined } : undefined}
        mode={editingCliente ? 'edit' : 'create'}
      />
    </div>
  )
}

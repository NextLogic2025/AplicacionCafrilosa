import { Users, UserPlus } from 'lucide-react'
import { SectionHeader } from 'components/ui/SectionHeader'
import { PageHero } from 'components/ui/PageHero'
import { Button } from 'components/ui/Button'
import { useState, useEffect } from 'react'
import { obtenerClientes, eliminarCliente, obtenerZonas, obtenerListasPrecios, type Cliente, type ZonaComercial, type ListaPrecio } from '../../services/clientesApi'
import { ClienteList } from './ClienteList'
import { CrearClienteModal } from './CrearClienteModal'
import { ClienteDetailModal } from './ClienteDetailModal'

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null)
  const [detailCliente, setDetailCliente] = useState<Cliente | null>(null)
  const [zonas, setZonas] = useState<ZonaComercial[]>([])
  const [listasPrecios, setListasPrecios] = useState<ListaPrecio[]>([])

  // Estado para notificaciones toast globales
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

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

  const handleCloseDetail = () => {
    setDetailCliente(null)
  }

  const handleSuccessCreate = () => {
    cargarClientes()
    // Mostrar toast de éxito
    const message = editingCliente ? '¡Cliente actualizado con éxito!' : '¡Cliente creado con éxito!'
    setToast({ type: 'success', message })
    setTimeout(() => setToast(null), 3000)
  }

  const handleEdit = (cliente: Cliente) => {
    setEditingCliente(cliente)
    setIsModalOpen(true)
  }

  const handleView = (cliente: Cliente) => {
    setDetailCliente(cliente)
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
        onView={handleView}
        zonas={zonas}
        listasPrecios={listasPrecios}
      />

      <CrearClienteModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSuccess={handleSuccessCreate}
        initialData={editingCliente ? {
          id: editingCliente.id,
          usuario_principal_id: editingCliente.usuario_principal_id,
          identificacion: editingCliente.identificacion,
          tipo_identificacion: editingCliente.tipo_identificacion,
          razon_social: editingCliente.razon_social,
          nombre_comercial: editingCliente.nombre_comercial || '',
          direccion_texto: editingCliente.direccion_texto || '',
          lista_precios_id: editingCliente.lista_precios_id,
          zona_comercial_id: editingCliente.zona_comercial_id,
          // Extraer coordenadas de ubicacion_gps (GeoJSON format) o usar latitud/longitud si existen
          latitud: editingCliente.ubicacion_gps?.coordinates
            ? editingCliente.ubicacion_gps.coordinates[1]  // lat es el segundo elemento
            : editingCliente.latitud,
          longitud: editingCliente.ubicacion_gps?.coordinates
            ? editingCliente.ubicacion_gps.coordinates[0]  // lng es el primer elemento
            : editingCliente.longitud,
          // Campos de contacto no se editan en modo edición
          contacto_nombre: '',
          contacto_email: '',
          contacto_password: '',
        } : undefined}
        mode={editingCliente ? 'edit' : 'create'}
      />

      <ClienteDetailModal
        isOpen={!!detailCliente}
        onClose={handleCloseDetail}
        cliente={detailCliente}
        zonas={zonas}
        listasPrecios={listasPrecios}
      />

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3 z-50 ${toast.type === 'success'
            ? 'bg-green-500 text-white'
            : 'bg-red-500 text-white'
            }`}
          style={{
            animation: 'slideInRight 0.3s ease-out',
          }}
        >
          <div className="flex items-center gap-3">
            {toast.type === 'success' ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            <span className="font-semibold">{toast.message}</span>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}

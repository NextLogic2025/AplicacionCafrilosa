import React, { useState, useEffect } from 'react'
import { X, Search, Trash2, Check } from 'lucide-react'
import { obtenerClientes } from '../services/clientesApi'
import type { Cliente } from '../services/clientesApi'
import type { ClienteCampania, AddClienteCampaniaDto } from '../services/promocionesApi'

interface ClienteSelectorModalProps {
  isOpen: boolean
  onClose: () => void
  campaniaId: number
  clientesAsignados: ClienteCampania[]
  onAddCliente: (clienteId: string) => Promise<void>
  onDeleteCliente: (clienteId: string) => Promise<void>
}

export default function ClienteSelectorModal({
  isOpen,
  onClose,
  campaniaId,
  clientesAsignados,
  onAddCliente,
  onDeleteCliente,
}: ClienteSelectorModalProps) {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      loadClientes()
    }
  }, [isOpen])

  const loadClientes = async () => {
    setLoading(true)
    try {
      const data = await obtenerClientes()
      setClientes(data)
    } catch (error) {
      console.error('Error al cargar clientes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddCliente = async () => {
    if (!selectedCliente) return

    try {
      await onAddCliente(selectedCliente.id)
      setSelectedCliente(null)
      setSearchTerm('')
      setSuccessMessage(`✓ ${selectedCliente.razon_social} agregado correctamente`)
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error) {
      console.error('Error al agregar cliente:', error)
    }
  }

  const handleDeleteCliente = async (clienteId: string) => {
    const cliente = clientesAsignados.find(c => c.cliente_id === clienteId)
    if (!cliente?.cliente) return

    const confirmDelete = window.confirm(
      `¿Desea eliminar a ${cliente.cliente.razon_social} de esta campaña?`
    )
    if (!confirmDelete) return

    try {
      await onDeleteCliente(clienteId)
      setSuccessMessage('✓ Cliente eliminado de la campaña')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error) {
      console.error('Error al eliminar cliente:', error)
    }
  }

  if (!isOpen) return null

  const clientesFiltrados = clientes.filter(cliente => {
    const matchesSearch = searchTerm.trim() === '' || 
      cliente.razon_social.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente.identificacion.toLowerCase().includes(searchTerm.toLowerCase())
    
    const yaAsignado = clientesAsignados.some(ca => ca.cliente_id === cliente.id)
    
    return matchesSearch && !yaAsignado
  }).slice(0, 20)

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">
            Asignar Clientes a la Campaña
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Success Message */}
          {successMessage && (
            <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
              {successMessage}
            </div>
          )}

          {/* Search Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-700">Buscar Cliente</h3>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar por identificación o razón social..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {selectedCliente && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-800">
                      {selectedCliente.razon_social}
                    </p>
                    <p className="text-sm text-gray-600">
                      ID: {selectedCliente.identificacion}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedCliente(null)}
                    className="p-2 hover:bg-blue-100 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5 text-blue-600" />
                  </button>
                </div>
              </div>
            )}

            {searchTerm && !selectedCliente && (
              <div className="border border-gray-200 rounded-lg divide-y max-h-60 overflow-y-auto">
                {loading ? (
                  <div className="p-4 text-center text-gray-500">Cargando...</div>
                ) : clientesFiltrados.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    No se encontraron clientes
                  </div>
                ) : (
                  clientesFiltrados.map((cliente) => (
                    <div
                      key={cliente.id}
                      onClick={() => setSelectedCliente(cliente)}
                      className="p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <p className="font-medium text-gray-800">{cliente.razon_social}</p>
                      <p className="text-sm text-gray-600">ID: {cliente.identificacion}</p>
                    </div>
                  ))
                )}
              </div>
            )}

            <button
              onClick={handleAddCliente}
              disabled={!selectedCliente}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
            >
              Agregar Cliente
            </button>
          </div>

          {/* Assigned Clients */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-700">
              Clientes Asignados ({clientesAsignados.length})
            </h3>
            
            {clientesAsignados.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No hay clientes asignados a esta campaña
              </p>
            ) : (
              <div className="space-y-2">
                {clientesAsignados.map((clienteCampania) => (
                  <div
                    key={clienteCampania.cliente_id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div>
                      <p className="font-medium text-gray-800">
                        {clienteCampania.cliente?.razon_social || 'Cliente'}
                      </p>
                      <p className="text-sm text-gray-600">
                        ID: {clienteCampania.cliente?.identificacion || clienteCampania.cliente_id}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteCliente(clienteCampania.cliente_id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Eliminar cliente"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t p-6">
          <button
            onClick={onClose}
            className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors font-medium"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}

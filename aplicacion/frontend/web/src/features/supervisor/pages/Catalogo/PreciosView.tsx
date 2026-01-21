import { useState, useEffect } from 'react'
import { PlusCircle, Settings } from 'lucide-react'
import { Alert } from 'components/ui/Alert'
import { useEntityCrud } from '../../../../hooks/useEntityCrud'
import { useModal } from '../../../../hooks/useModal'
import {
  asignarPrecio,
  eliminarPrecioAsignado,
  obtenerPreciosDeProducto,
  getAllListasPrecios,
  createListaPrecio,
  updateListaPrecio,
  deleteListaPrecio,
  type PrecioItem,
  type AsignarPrecioDto,
  type ListaPrecio,
  type CreateListaPrecioDto,
} from '../../services/preciosApi'
import { getAllProducts, type Product } from '../../services/productosApi'
import { AsignarPrecioModal } from './precios/AsignarPrecioModal'
import { ListasPreciosModal } from './precios/ListasPreciosModal'
import { TablaPrecios } from './precios/TablaPrecios'


export function PreciosView() {
  const { data: products, isLoading, error } = useEntityCrud<Product, any, any>({
    load: getAllProducts,
    create: async () => new Promise(() => {}),
    update: async () => new Promise(() => {}),
    delete: async () => new Promise(() => {}),
  })

  const {
    data: listasPrecios,
    isLoading: isLoadingListas,
    create: createLista,
    update: updateLista,
    delete: deleteLista,
    refresh: refreshListas,
  } = useEntityCrud<ListaPrecio, CreateListaPrecioDto, CreateListaPrecioDto>({
    load: getAllListasPrecios,
    create: createListaPrecio,
    update: (id, data) => updateListaPrecio(typeof id === 'string' ? parseInt(id) : id, data),
    delete: (id) => deleteListaPrecio(typeof id === 'string' ? parseInt(id) : id),
  })

  const [preciosMap, setPreciosMap] = useState<Map<string, PrecioItem[]>>(new Map())
  const [isLoadingPrecios, setIsLoadingPrecios] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalProductoId, setModalProductoId] = useState<string | null>(null)
  const [isListaModalOpen, setIsListaModalOpen] = useState(false)

  useEffect(() => {
    if (products.length > 0 && isLoadingPrecios) {
      loadPreciosMap()
    }
  }, [products, isLoadingPrecios])

  const loadPreciosMap = async () => {
    try {
      setIsLoadingPrecios(true)
      const preciosData = new Map<string, PrecioItem[]>()
      for (const product of products) {
        try {
          const precios = await obtenerPreciosDeProducto(product.id)
          preciosData.set(product.id, precios)
        } catch {
          preciosData.set(product.id, [])
        }
      }
      setPreciosMap(preciosData)
    } finally {
      setIsLoadingPrecios(false)
    }
  }

  // Handlers para modales
  // Solo se abre desde la tabla, siempre con productoId
  const handleOpenModal = (productoId: string) => {
    setModalProductoId(productoId)
    setIsModalOpen(true)
  }
  const handleCloseModal = () => {
    setIsModalOpen(false)
    setModalProductoId(null)
  }
  const handleOpenListaModal = () => setIsListaModalOpen(true)
  const handleCloseListaModal = () => setIsListaModalOpen(false)

  // Asignar precio
  const handleAsignarPrecio = async (data: AsignarPrecioDto) => {
    await asignarPrecio(data)
    await loadPreciosMap()
  }

  // Eliminar precio
  const handleDeletePrecio = async (productoId: string, listaId: number) => {
    if (window.confirm('¿Eliminar este precio asignado?')) {
      await eliminarPrecioAsignado(listaId, productoId)
      await loadPreciosMap()
    }
  }

  // Crear/editar/eliminar lista
  const handleCreateLista = async (data: CreateListaPrecioDto) => {
    await createLista(data)
    await refreshListas()
  }
  const handleUpdateLista = async (id: number, data: CreateListaPrecioDto) => {
    await updateLista(id, data)
    await refreshListas()
  }
  const handleDeleteLista = async (id: number) => {
    if (window.confirm('¿Eliminar esta lista de precios?')) {
      await deleteLista(id.toString())
      await refreshListas()
    }
  }

  if (isLoading || isLoadingPrecios || isLoadingListas) {
    return (
      <div className="flex justify-center py-12">
        <span>Cargando...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Listas de Precios</h2>
          <p className="mt-1 text-sm text-gray-600">
            Administra precios por lista y gestiona tus listas de precios
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleOpenListaModal}
            className="flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-lg font-semibold transition"
          >
            <Settings className="h-4 w-4" />
            Gestionar listas
          </button>
        </div>
      </div>

      {error && <Alert type="error" message={error} />}


      <TablaPrecios
        products={products}
        listasPrecios={listasPrecios}
        preciosMap={preciosMap}
        onEdit={handleOpenModal}
        onDelete={handleDeletePrecio}
        isLoading={isLoadingPrecios}
      />

      <AsignarPrecioModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleAsignarPrecio}
        productos={products}
        listas={listasPrecios}
        productoId={modalProductoId}
      />

      <ListasPreciosModal
        isOpen={isListaModalOpen}
        onClose={handleCloseListaModal}
        listas={listasPrecios}
        onCreate={handleCreateLista}
        onUpdate={handleUpdateLista}
        onDelete={handleDeleteLista}
      />
    </div>
  )
}
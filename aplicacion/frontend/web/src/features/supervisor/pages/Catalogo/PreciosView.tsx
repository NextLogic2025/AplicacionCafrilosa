import { useState, useEffect } from 'react'
import { PlusCircle, DollarSign, Settings } from 'lucide-react'
import { Modal } from 'components/ui/Modal'
import { TextField } from 'components/ui/TextField'
import { Alert } from 'components/ui/Alert'
import { LoadingSpinner } from 'components/ui/LoadingSpinner'
import { EntityList } from '../../../../components/ui/EntityList'
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
  type CreateListaPrecioDto
} from '../../services/preciosApi'
import { getAllProducts, type Product } from '../../services/productosApi'

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
    refresh: refreshListas
  } = useEntityCrud<ListaPrecio, CreateListaPrecioDto, CreateListaPrecioDto>({
    load: getAllListasPrecios,
    create: createListaPrecio,
    update: (id, data) => updateListaPrecio(typeof id === 'string' ? parseInt(id) : id, data),
    delete: (id) => deleteListaPrecio(typeof id === 'string' ? parseInt(id) : id),
  })

  const [preciosMap, setPreciosMap] = useState<Map<string, PrecioItem[]>>(new Map())
  const [isLoadingPrecios, setIsLoadingPrecios] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isListaModalOpen, setIsListaModalOpen] = useState(false)
  const [listaFormData, setListaFormData] = useState<CreateListaPrecioDto>({ nombre: '' })
  const [formData, setFormData] = useState<AsignarPrecioDto>({
    productoId: '',
    listaId: 1,
    precio: 0,
  })
  
  const listaModal = useModal<ListaPrecio>()

  useEffect(() => {
    if (products.length > 0 && isLoadingPrecios) {
      loadPreciosMap()
    }
  }, [products, isLoadingPrecios])

  const handleSubmitLista = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!listaFormData.nombre.trim()) {
      alert('El nombre de la lista es requerido')
      return
    }

    try {
      if (listaModal.editingItem) {
        await updateLista(listaModal.editingItem.id.toString(), listaFormData)
      } else {
        await createLista(listaFormData)
      }
      
      await refreshListas()
      handleCloseListaModal()
    } catch (error: any) {
      alert(error.message || 'Error al guardar la lista')
    }
  }

  const handleOpenListaModal = (lista?: ListaPrecio) => {
    if (lista) {
      listaModal.openEdit(lista)
      setListaFormData({ nombre: lista.nombre })
    } else {
      listaModal.openCreate()
      setListaFormData({ nombre: '' })
    }
    setIsListaModalOpen(true)
  }

  const handleCloseListaModal = () => {
    setIsListaModalOpen(false)
    listaModal.close()
    setListaFormData({ nombre: '' })
  }

  const handleDeleteLista = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar esta lista de precios?')) return
    
    try {
      await deleteLista(id.toString())
      await refreshListas()
    } catch (error: any) {
      alert(error.message || 'Error al eliminar la lista')
    }
  }

  const handleDeletePrecio = async (productoId: string, listaId: number) => {
    const precioActual = getPrecioForProductoAndLista(productoId, listaId)
    if (precioActual === null) return

    const confirmed = confirm('¿Eliminar este precio asignado?')
    if (!confirmed) return

    try {
      await eliminarPrecioAsignado(listaId, productoId)
      await loadPreciosMap()
    } catch (error: any) {
      alert(error.message || 'Error al eliminar el precio')
    }
  }

  const handleOpenModal = (productoId?: string) => {
    setFormData({
      productoId: productoId || '',
      listaId: 1,
      precio: 0,
    })
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setFormData({ productoId: '', listaId: 1, precio: 0 })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.productoId || formData.precio <= 0) {
      alert('Completa todos los campos correctamente')
      return
    }

    try {
      await asignarPrecio(formData)
      await loadPreciosMap()
      handleCloseModal()
    } catch (error: any) {
      alert(error.message || 'Error al asignar precio')
    }
  }

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

  const getPrecioForProductoAndLista = (productoId: string, listaId: number): number | null => {
    const precios = preciosMap.get(productoId) || []
    const precio = precios.find((p: PrecioItem) => p.lista_id === listaId)
    return precio ? parseFloat(precio.precio as any) : null
  }

  if (isLoading || isLoadingPrecios || isLoadingListas) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
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
            onClick={() => handleOpenListaModal()}
            className="flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-lg font-semibold transition"
          >
            <Settings className="h-4 w-4" />
            Gestionar listas
          </button>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 bg-brand-red text-white hover:bg-brand-red/90 px-4 py-2 rounded-lg font-semibold transition"
          >
            <PlusCircle className="h-4 w-4" />
            Asignar precio
          </button>
        </div>
      </div>

      {error && <Alert type="error" message={error} />}

      {products.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <DollarSign className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-gray-900">No hay productos</h3>
          <p className="mt-2 text-sm text-gray-600">Primero crea productos en el catálogo</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
          <table className="w-full">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">SKU</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Producto</th>
                {listasPrecios.map((lista) => (
                  <th key={lista.id} className="px-6 py-3 text-center text-sm font-semibold text-gray-900">
                    {lista.nombre}
                  </th>
                ))}
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">Estado</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{product.codigo_sku}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    <p className="font-medium">{product.nombre}</p>
                  </td>
                  {listasPrecios.map((lista) => {
                    const precio = getPrecioForProductoAndLista(product.id, lista.id)
                    return (
                      <td key={`${product.id}-${lista.id}`} className="px-6 py-4 text-center">
                        {precio !== null ? (
                          <div className="flex flex-col items-center gap-2">
                            <span className="inline-block rounded-lg px-3 py-1 text-sm font-semibold bg-green-50 text-green-800">
                              ${precio.toFixed(2)}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDeletePrecio(product.id, lista.id)}
                              className="text-xs text-red-600 hover:text-red-700"
                            >
                              Eliminar precio
                            </button>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">—</span>
                        )}
                      </td>
                    )
                  })}
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleOpenModal(product.id)}
                      className="rounded-lg p-2 text-blue-600 transition-colors hover:bg-blue-50"
                      title="Editar precio"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        title="Asignar Precio"
        onClose={handleCloseModal}
        headerGradient="red"
        maxWidth="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <label className="text-xs text-neutral-600">Producto</label>
            <select
              value={formData.productoId}
              onChange={(e) => setFormData({ ...formData, productoId: e.target.value })}
              className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-neutral-900 outline-none transition focus:border-brand-red/60 focus:shadow-[0_0_0_4px_rgba(240,65,45,0.18)]"
            >
              <option value="">Selecciona un producto</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.codigo_sku} - {product.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-2">
            <label className="text-xs text-neutral-600">Lista de Precio</label>
            <select
              value={formData.listaId}
              onChange={(e) => setFormData({ ...formData, listaId: parseInt(e.target.value) })}
              className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-neutral-900 outline-none transition focus:border-brand-red/60 focus:shadow-[0_0_0_4px_rgba(240,65,45,0.18)]"
            >
              {listasPrecios.map((lista) => (
                <option key={lista.id} value={lista.id}>
                  {lista.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-2">
            <label className="text-xs text-neutral-600">Precio</label>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="Ej: 29.99"
              value={formData.precio}
              onChange={(e) => setFormData({ ...formData, precio: parseFloat(e.target.value) || 0 })}
              className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-neutral-900 outline-none transition focus:border-brand-red/60 focus:shadow-[0_0_0_4px_rgba(240,65,45,0.18)]"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={handleCloseModal}
              className="px-4 py-2 rounded-lg text-neutral-700 bg-neutral-200 hover:bg-neutral-300 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-brand-red text-white hover:bg-brand-red/90 transition font-semibold"
            >
              Asignar precio
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal para gestionar listas */}
      <Modal
        isOpen={isListaModalOpen}
        title={listaModal.isEditing ? 'Editar Lista de Precios' : 'Crear Lista de Precios'}
        onClose={handleCloseListaModal}
        headerGradient="blue"
        maxWidth="lg"
      >
        <div className="space-y-6">
          {/* Formulario */}
          <form onSubmit={handleSubmitLista} className="space-y-4 pb-4 border-b border-gray-200">
            <TextField
              label="Nombre de la lista"
              tone="light"
              type="text"
              placeholder="Ej: Mayorista, Distribuidor, Especial"
              value={listaFormData.nombre}
              onChange={(e) => setListaFormData({ nombre: e.target.value })}
            />

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleCloseListaModal}
                className="px-4 py-2 rounded-lg text-neutral-700 bg-neutral-200 hover:bg-neutral-300 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition font-semibold"
              >
                {listaModal.isEditing ? 'Actualizar' : 'Crear lista'}
              </button>
            </div>
          </form>

          {/* Lista de listas existentes */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Listas existentes</h3>
            <EntityList<ListaPrecio>
              items={listasPrecios}
              renderItem={(lista) => (
                <div>
                  <p className="font-medium text-gray-900">{lista.nombre}</p>
                  <p className="text-xs text-gray-500">ID: {lista.id}</p>
                </div>
              )}
              onEdit={handleOpenListaModal}
              onDelete={(lista) => handleDeleteLista(lista.id)}
              emptyMessage="No hay listas de precios creadas"
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}
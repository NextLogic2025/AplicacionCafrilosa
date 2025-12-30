import { useState, useEffect } from 'react'
import { PlusCircle, Edit2, DollarSign } from 'lucide-react'
import { Button } from 'components/ui/Button'
import { Modal } from 'components/ui/Modal'
import { TextField } from 'components/ui/TextField'
import { Alert } from 'components/ui/Alert'
import { LoadingSpinner } from 'components/ui/LoadingSpinner'
import { asignarPrecio, obtenerPreciosDeProducto, type PrecioItem, type AsignarPrecioDto } from '../../services/preciosApi'
import { getAllProducts, type Product } from '../../services/productosApi'

const LISTAS_PRECIOS = [
  { id: 1, nombre: 'General' },
  { id: 2, nombre: 'Mayorista' },
  { id: 3, nombre: 'Horeca' },
]

export function PreciosView() {
  const [products, setProducts] = useState<Product[]>([])
  const [preciosMap, setPreciosMap] = useState<Map<string, PrecioItem[]>>(new Map())
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState<AsignarPrecioDto>({
    productoId: '',
    listaId: 1,
    precio: 0,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitMessage, setSubmitMessage] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    try {
      setIsLoading(true)
      const productsData = await getAllProducts()
      setProducts(productsData)

      // Cargar precios para cada producto
      const preciosData = new Map<string, PrecioItem[]>()
      for (const product of productsData) {
        try {
          const precios = await obtenerPreciosDeProducto(product.id)
          preciosData.set(product.id, precios)
        } catch (error) {
          // Si no hay precios para este producto, continuar
          preciosData.set(product.id, [])
        }
      }
      setPreciosMap(preciosData)
    } catch (error) {
      console.error('Error al cargar datos:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenModal = (productoId?: string) => {
    if (productoId) {
      setFormData({
        productoId,
        listaId: 1,
        precio: 0,
      })
    } else {
      setFormData({
        productoId: '',
        listaId: 1,
        precio: 0,
      })
    }
    setIsModalOpen(true)
    setErrors({})
    setSubmitMessage(null)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setFormData({
      productoId: '',
      listaId: 1,
      precio: 0,
    })
    setErrors({})
    setSubmitMessage(null)
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.productoId) {
      newErrors.productoId = 'Debes seleccionar un producto'
    }

    if (formData.precio < 0) {
      newErrors.precio = 'El precio no puede ser negativo'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitMessage(null)

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      await asignarPrecio(formData)
      setSubmitMessage({
        type: 'success',
        message: 'Precio asignado exitosamente',
      })

      await loadInitialData()

      setTimeout(() => {
        handleCloseModal()
      }, 1500)
    } catch (error: any) {
      setSubmitMessage({
        type: 'error',
        message: error.message || 'Error al asignar el precio',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getPrecioForProductoAndLista = (productoId: string, listaId: number): number | null => {
    const precios = preciosMap.get(productoId) || []
    const precio = precios.find((p) => p.lista_id === listaId)
    return precio ? parseFloat(String(precio.precio)) : null
  }

  const getProductoNombre = (productoId: string): string => {
    const producto = products.find((p) => p.id === productoId)
    return producto?.nombre || productoId
  }

  if (isLoading) {
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
            Administra precios por lista (General, Mayorista, Horeca)
          </p>
        </div>
        <Button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-brand-red text-white hover:bg-brand-red/90"
        >
          <PlusCircle className="h-4 w-4" />
          Asignar precio
        </Button>
      </div>

      {products.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <DollarSign className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-gray-900">
            No hay productos
          </h3>
          <p className="mt-2 text-sm text-gray-600">
            Primero crea productos en el catálogo
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
          <table className="w-full">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  SKU
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Producto
                </th>
                {LISTAS_PRECIOS.map((lista) => (
                  <th
                    key={lista.id}
                    className="px-6 py-3 text-center text-sm font-semibold text-gray-900"
                  >
                    {lista.nombre}
                  </th>
                ))}
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {product.codigo_sku}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    <p className="font-medium">{product.nombre}</p>
                  </td>
                  {LISTAS_PRECIOS.map((lista) => {
                    const precio = getPrecioForProductoAndLista(product.id, lista.id)
                    return (
                      <td key={`${product.id}-${lista.id}`} className="px-6 py-4 text-center">
                        {precio !== null ? (
                          <span className="inline-block rounded-lg bg-green-50 px-3 py-1 text-sm font-semibold text-green-800">
                            ${precio.toFixed(2)}
                          </span>
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
                      <Edit2 className="h-4 w-4" />
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
          {submitMessage && (
            <Alert
              type={submitMessage.type}
              message={submitMessage.message}
              onClose={() => setSubmitMessage(null)}
            />
          )}

          <div className="grid gap-2">
            <label className="text-xs text-neutral-600">Producto</label>
            <select
              value={formData.productoId}
              onChange={(e) =>
                setFormData({ ...formData, productoId: e.target.value })
              }
              className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-neutral-900 outline-none transition focus:border-brand-red/60 focus:shadow-[0_0_0_4px_rgba(240,65,45,0.18)] disabled:opacity-50"
              disabled={isSubmitting}
            >
              <option value="">Selecciona un producto</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.codigo_sku} - {product.nombre}
                </option>
              ))}
            </select>
            {errors.productoId && (
              <span className="text-xs text-red-700">{errors.productoId}</span>
            )}
          </div>

          <div className="grid gap-2">
            <label className="text-xs text-neutral-600">Lista de Precio</label>
            <select
              value={formData.listaId}
              onChange={(e) =>
                setFormData({ ...formData, listaId: parseInt(e.target.value) })
              }
              className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-neutral-900 outline-none transition focus:border-brand-red/60 focus:shadow-[0_0_0_4px_rgba(240,65,45,0.18)] disabled:opacity-50"
              disabled={isSubmitting}
            >
              {LISTAS_PRECIOS.map((lista) => (
                <option key={lista.id} value={lista.id}>
                  {lista.nombre}
                </option>
              ))}
            </select>
          </div>

          <TextField
            label="Precio"
            tone="light"
            type="number"
            step="0.01"
            min="0"
            placeholder="Ej: 29.99"
            value={formData.precio}
            onChange={(e) =>
              setFormData({ ...formData, precio: parseFloat(e.target.value) || 0 })
            }
            error={errors.precio}
            disabled={isSubmitting}
          />

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              onClick={handleCloseModal}
              className="bg-neutral-200 text-neutral-700 hover:bg-neutral-300"
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-brand-red text-white hover:bg-brand-red/90 disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Guardando...' : 'Asignar precio'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

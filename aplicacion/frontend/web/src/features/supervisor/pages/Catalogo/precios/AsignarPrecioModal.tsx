import { Modal } from 'components/ui/Modal'
import { Alert } from 'components/ui/Alert'
import { useState } from 'react'
import type { ListaPrecio, AsignarPrecioDto } from '../../../services/preciosApi'
// Producto se define igual que en preciosApi: { id: string, codigo_sku: string, nombre: string }
type Producto = { id: string; codigo_sku: string; nombre: string }

interface AsignarPrecioModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: AsignarPrecioDto) => Promise<void>
  productos: Producto[]
  listas: ListaPrecio[]
  initialData?: AsignarPrecioDto
  productoId?: string | null
}

export function AsignarPrecioModal({ isOpen, onClose, onSubmit, productos, listas, initialData, productoId }: AsignarPrecioModalProps) {
  // Si productoId viene por prop, úsalo siempre como valor fuente
  const [formData, setFormData] = useState<AsignarPrecioDto>(initialData || {
    productoId: productoId || '',
    listaId: listas[0]?.id || 1,
    precio: 0,
  })
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    // Si el productoId viene por prop, nunca lo sobrescribas
    if (name === 'productoId' && productoId) return
    setFormData((prev: AsignarPrecioDto) => ({
      ...prev,
      [name]: name === 'precio' ? parseFloat(value) : name === 'listaId' ? parseInt(value) : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // Validación básica
    const idToSend = productoId || formData.productoId
    if (!idToSend || idToSend.length < 10) {
      setErrorMsg('Selecciona un producto válido.')
      return
    }
    if (!formData.listaId || isNaN(Number(formData.listaId))) {
      setErrorMsg('Selecciona una lista de precios.')
      return
    }
    if (!formData.precio || isNaN(Number(formData.precio)) || formData.precio < 0.01) {
      setErrorMsg('El precio debe ser mayor a 0.')
      return
    }
    setErrorMsg(null)
    setLoading(true)
    try {
      await onSubmit({ ...formData, productoId: idToSend })
      onClose()
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al asignar el precio')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} title="Asignar Precio" onClose={onClose} headerGradient="red" maxWidth="md">
      {errorMsg && <Alert type="error" message={errorMsg} />}
      <form onSubmit={handleSubmit} className="space-y-4">
        {productoId ? (
          <div className="grid gap-2">
            <label className="text-xs text-neutral-600">Producto</label>
            <input
              type="text"
              value={productos.find(p => p.id === productoId)?.nombre || ''}
              disabled
              className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-neutral-900"
              // El valor real de productoId se mantiene en el estado y se envía por handleSubmit
            />
          </div>
        ) : (
          <div className="grid gap-2">
            <label className="text-xs text-neutral-600">Producto</label>
            <select
              name="productoId"
              value={formData.productoId}
              onChange={handleChange}
              className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-neutral-900 outline-none transition focus:border-brand-red/60 focus:shadow-[0_0_0_4px_rgba(240,65,45,0.18)]"
            >
              <option value="">Selecciona un producto</option>
              {productos.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.codigo_sku} - {product.nombre}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="grid gap-2">
          <label className="text-xs text-neutral-600">Lista de Precio</label>
          <select
            name="listaId"
            value={formData.listaId}
            onChange={handleChange}
            className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-neutral-900 outline-none transition focus:border-brand-red/60 focus:shadow-[0_0_0_4px_rgba(240,65,45,0.18)]"
          >
            {listas.map((lista) => (
              <option key={lista.id} value={lista.id}>
                {lista.nombre}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-2">
          <label className="text-xs text-neutral-600">Precio</label>
          <input
            name="precio"
            type="number"
            step="0.01"
            min="0"
            placeholder="Ej: 29.99"
            value={formData.precio}
            onChange={handleChange}
            className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-neutral-900 outline-none transition focus:border-brand-red/60 focus:shadow-[0_0_0_4px_rgba(240,65,45,0.18)]"
          />
        </div>
        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-neutral-700 bg-neutral-200 hover:bg-neutral-300 transition"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-brand-red text-white hover:bg-brand-red/90 transition font-semibold"
            disabled={loading}
          >
            Asignar precio
          </button>
        </div>
      </form>
    </Modal>
  )
}

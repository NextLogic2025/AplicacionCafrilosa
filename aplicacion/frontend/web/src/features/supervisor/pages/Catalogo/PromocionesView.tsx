import { useState, useEffect } from 'react'
import { Modal } from 'components/ui/Modal'
import { TextField } from 'components/ui/TextField'
import { Button } from 'components/ui/Button'
import { Alert } from 'components/ui/Alert'
import { LoadingSpinner } from 'components/ui/LoadingSpinner'
import { Percent, PlusCircle, Trash2 } from 'lucide-react'
import {
  getAllCampanias,
  createCampania,
  updateCampania,
  deleteCampania,
  getProductosByCampania,
  addProductoPromo,
  deleteProductoPromo,
    getClientesByCampania,
    addClienteCampania,
    deleteClienteCampania,
  type Campania,
  type CreateCampaniaDto,
  type ProductoPromocion,
  type ClienteCampania,
} from '../../services/promocionesApi'
import { obtenerListasPrecios, obtenerClientes, type ListaPrecio, type Cliente } from '../../services/clientesApi'
import { getAllProducts, type Product } from '../../services/productosApi'
import { CampaniaCard } from '../../components/CampaniaCard'
import { ProductSelectorModal } from '../../components/ProductSelectorModal'
import ClienteSelectorModal from '../../components/ClienteSelectorModal'

export function PromocionesView() {
  const [campanias, setCampanias] = useState<Campania[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string>('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCampania, setEditingCampania] = useState<Campania | null>(null)
  const [listasPrecios, setListasPrecios] = useState<ListaPrecio[]>([])
  const [productos, setProductos] = useState<Product[]>([])
  const [productosAsignados, setProductosAsignados] = useState<ProductoPromocion[]>([])
  const [isProductModalOpen, setIsProductModalOpen] = useState(false)
    const [clientes, setClientes] = useState<Cliente[]>([])
    const [clientesAsignados, setClientesAsignados] = useState<ClienteCampania[]>([])
    const [isClientModalOpen, setIsClientModalOpen] = useState(false)
    const [campaniaIdForClientes, setCampaniaIdForClientes] = useState<number | null>(null)
  const [filtroEstado, setFiltroEstado] = useState<'todas' | 'activas' | 'inactivas'>('todas')
  const [filtroAlcance, setFiltroAlcance] = useState<'todos' | 'GLOBAL' | 'POR_LISTA' | 'POR_CLIENTE'>('todos')
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [selectedCampania, setSelectedCampania] = useState<Campania | null>(null)
  const [formData, setFormData] = useState<CreateCampaniaDto>({
    nombre: '',
    descripcion: '',
    fecha_inicio: '',
    fecha_fin: '',
    tipo_descuento: 'PORCENTAJE',
    valor_descuento: 0,
    alcance: 'GLOBAL',
    lista_precios_objetivo_id: undefined,
    activo: true,
  })

  useEffect(() => {
    loadCampanias()
    loadListasPrecios()
    loadProductos()
    loadClientes()
  }, [])

  const loadProductos = async () => {
    try {
      const data = await getAllProducts()
      setProductos(data)
    } catch (err) {
      console.error('Error al cargar productos:', err)
    }
  }

  const loadClientes = async () => {
    try {
      const data = await obtenerClientes()
      setClientes(data)
    } catch (err) {
      console.error('Error al cargar clientes:', err)
    }
  }

  const loadListasPrecios = async () => {
    try {
      const data = await obtenerListasPrecios()
      setListasPrecios(data)
    } catch (err) {
      console.error('Error al cargar listas de precios:', err)
    }
  }

  const loadCampanias = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await getAllCampanias()
      setCampanias(data)
    } catch (err: any) {
      setError(err.message || 'Error al cargar campañas')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenModal = (campania?: Campania) => {
    if (campania) {
      setEditingCampania(campania)
      setFormData({
        nombre: campania.nombre,
        descripcion: campania.descripcion || '',
        fecha_inicio: campania.fecha_inicio.split('T')[0],
        fecha_fin: campania.fecha_fin.split('T')[0],
        tipo_descuento: (campania.tipo_descuento as any) || 'PORCENTAJE',
        valor_descuento: parseFloat(campania.valor_descuento || '0'),
        alcance: (campania.alcance as any) || 'GLOBAL',
        lista_precios_objetivo_id: campania.lista_precios_objetivo_id || undefined,
        activo: campania.activo,
      })
    } else {
      setEditingCampania(null)
      setFormData({
        nombre: '',
        descripcion: '',
        fecha_inicio: '',
        fecha_fin: '',
        tipo_descuento: 'PORCENTAJE',
        valor_descuento: 0,
        alcance: 'GLOBAL',
        lista_precios_objetivo_id: undefined,
        activo: true,
      })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingCampania(null)
    setFormData({
      nombre: '',
      descripcion: '',
      fecha_inicio: '',
      fecha_fin: '',
      tipo_descuento: 'PORCENTAJE',
      valor_descuento: 0,
      alcance: 'GLOBAL',
      lista_precios_objetivo_id: undefined,
      activo: true,
    })
  }

  const handleOpenProductModal = async (campania: Campania) => {
    setEditingCampania(campania)
    await loadProductosByCampania(campania.id)
    setIsProductModalOpen(true)
  }

  const handleOpenClientModal = async (campaniaId: number) => {
    setCampaniaIdForClientes(campaniaId)
    try {
      const clientes = await getClientesByCampania(campaniaId)
      setClientesAsignados(clientes)
      setIsClientModalOpen(true)
    } catch (err) {
      console.error('Error al cargar clientes de la campaña:', err)
      setClientesAsignados([])
      setIsClientModalOpen(true)
    }
  }

  const handleAddCliente = async (clienteId: string) => {
    if (!campaniaIdForClientes) return

    try {
      await addClienteCampania(campaniaIdForClientes, { cliente_id: clienteId })
      const clientes = await getClientesByCampania(campaniaIdForClientes)
      setClientesAsignados(clientes)
    } catch (err: any) {
      console.error('Error al agregar cliente:', err)
      throw new Error(err.message || 'Error al agregar cliente')
    }
  }

  const handleDeleteCliente = async (clienteId: string) => {
    if (!campaniaIdForClientes) return

    try {
      await deleteClienteCampania(campaniaIdForClientes, clienteId)
      const clientes = await getClientesByCampania(campaniaIdForClientes)
      setClientesAsignados(clientes)
    } catch (err: any) {
      console.error('Error al eliminar cliente:', err)
      throw new Error(err.message || 'Error al eliminar cliente')
    }
  }

  const handleAddProduct = async (productoId: string, precioOferta?: number) => {
    if (!editingCampania) return
    const producto = productos.find((p) => p.id === productoId)
    await addProductoPromo(editingCampania.id, {
      producto_id: productoId,
      precio_oferta_fijo: precioOferta,
    })
    await loadProductosByCampania(editingCampania.id)
    setSuccessMessage(`✓ "${producto?.nombre}" agregado correctamente`)
    setTimeout(() => setSuccessMessage(''), 3000)
  }

  const handleDeleteProduct = async (productoId: string) => {
    if (!editingCampania && !selectedCampania) return
    
    const campaniaId = editingCampania?.id || selectedCampania?.id
    if (!campaniaId) return

    if (!confirm('¿Eliminar este producto de la campaña?')) return

    try {
      await deleteProductoPromo(campaniaId, productoId)
      await loadProductosByCampania(campaniaId)
      setSuccessMessage('✓ Producto eliminado de la campaña')
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (err: any) {
      alert(err.message || 'Error al eliminar producto')
    }
  }

  const loadProductosByCampania = async (campaniaId: number) => {
    try {
      const data = await getProductosByCampania(campaniaId)
      setProductosAsignados(data)
    } catch (err) {
      console.error('Error al cargar productos de campaña:', err)
    }
  }

  const handleViewDetails = async (campania: Campania) => {
    setSelectedCampania(campania)
    await loadProductosByCampania(campania.id)
    setIsDetailModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.nombre || !formData.fecha_inicio || !formData.fecha_fin) {
      alert('Nombre y fechas son requeridos')
      return
    }

    try {
      // Convertir fechas a formato ISO con timezone
      const payload: any = {
        nombre: formData.nombre,
        descripcion: formData.descripcion || undefined,
        fecha_inicio: new Date(formData.fecha_inicio + 'T00:00:00Z').toISOString(),
        fecha_fin: new Date(formData.fecha_fin + 'T23:59:59Z').toISOString(),
        tipo_descuento: formData.tipo_descuento,
        valor_descuento: formData.valor_descuento,
        alcance: formData.alcance,
        activo: formData.activo,
      }

      // Solo agregar lista_precios_objetivo_id si alcance es POR_LISTA
      if (formData.alcance === 'POR_LISTA' && formData.lista_precios_objetivo_id) {
        payload.lista_precios_objetivo_id = formData.lista_precios_objetivo_id
      }

      console.log('Enviando payload:', payload)

      if (editingCampania) {
        await updateCampania(editingCampania.id, payload)
      } else {
        await createCampania(payload)
      }
      await loadCampanias()
      handleCloseModal()
    } catch (err: any) {
      console.error('Error al guardar:', err)
      alert(err.message || 'Error al guardar campaña')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar esta campaña?')) return

    try {
      await deleteCampania(id)
      await loadCampanias()
    } catch (err: any) {
      alert(err.message || 'Error al eliminar campaña')
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    )
  }

  // Filtrar campañas
  const campaniasFiltradas = campanias.filter((campania) => {
    // Filtro por estado
    if (filtroEstado === 'activas' && !campania.activo) return false
    if (filtroEstado === 'inactivas' && campania.activo) return false

    // Filtro por alcance
    if (filtroAlcance !== 'todos' && campania.alcance !== filtroAlcance) return false

    return true
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Campañas Promocionales</h2>
          <p className="mt-1 text-sm text-gray-600">
            Administra ofertas y descuentos especiales
          </p>
        </div>
        <Button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-brand-red text-white hover:bg-brand-red/90"
        >
          <PlusCircle className="h-4 w-4" />
          Nueva campaña
        </Button>
      </div>

      {error && <Alert type="error" message={error} />}

      {successMessage && <Alert type="success" message={successMessage} />}

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Estado:</label>
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value as any)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/20"
          >
            <option value="todas">Todas</option>
            <option value="activas">Activas</option>
            <option value="inactivas">Inactivas</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Tipo:</label>
          <select
            value={filtroAlcance}
            onChange={(e) => setFiltroAlcance(e.target.value as any)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/20"
          >
            <option value="todos">Todos</option>
            <option value="GLOBAL">General</option>
            <option value="POR_LISTA">Por lista</option>
            <option value="POR_CLIENTE">Por cliente</option>
          </select>
        </div>
      </div>

      {campaniasFiltradas.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-orange-100">
            <Percent className="h-8 w-8 text-orange-600" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-gray-900">
            {campanias.length === 0 ? 'No hay campañas' : 'No hay campañas que coincidan con los filtros'}
          </h3>
          <p className="mt-2 text-sm text-gray-600">
            {campanias.length === 0
              ? 'Crea tu primera campaña promocional'
              : 'Intenta ajustar los filtros'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {campaniasFiltradas.map((campania) => (
            <CampaniaCard
              key={campania.id}
              campania={campania}
              onEdit={() => handleOpenModal(campania)}
              onDelete={() => handleDelete(campania.id)}
              onManageProducts={() => handleOpenProductModal(campania)}
              onManageClientes={() => handleOpenClientModal(campania.id)}
              onViewDetails={() => handleViewDetails(campania)}
            />
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        title={editingCampania ? 'Editar Campaña' : 'Nueva Campaña'}
        onClose={handleCloseModal}
        headerGradient="red"
        maxWidth="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <TextField
            label="Nombre de la campaña"
            tone="light"
            type="text"
            placeholder="Ej: Ofertas de Verano"
            value={formData.nombre}
            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
          />

          <div className="grid gap-2">
            <label className="text-xs text-neutral-600">Descripción</label>
            <textarea
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              placeholder="Descripción de la campaña"
              className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-neutral-900 outline-none transition focus:border-brand-red/60 focus:shadow-[0_0_0_4px_rgba(240,65,45,0.18)]"
              rows={3}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <TextField
              label="Fecha de inicio"
              tone="light"
              type="date"
              value={formData.fecha_inicio}
              onChange={(e) => setFormData({ ...formData, fecha_inicio: e.target.value })}
            />

            <TextField
              label="Fecha de fin"
              tone="light"
              type="date"
              value={formData.fecha_fin}
              onChange={(e) => setFormData({ ...formData, fecha_fin: e.target.value })}
            />
          </div>

          <div className="grid gap-2">
            <label className="text-xs text-neutral-600">Alcance de la promoción</label>
            <select
              value={formData.alcance}
              onChange={(e) => setFormData({ ...formData, alcance: e.target.value as any })}
              className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-neutral-900 outline-none transition focus:border-brand-red/60 focus:shadow-[0_0_0_4px_rgba(240,65,45,0.18)]"
            >
              <option value="GLOBAL">General (todos los clientes)</option>
              <option value="POR_LISTA">Por lista de precios</option>
              <option value="POR_CLIENTE">Por cliente específico</option>
            </select>
          </div>

          {formData.alcance === 'POR_LISTA' && (
            <div className="grid gap-2">
              <label className="text-xs text-neutral-600">Lista de precios objetivo</label>
              <select
                value={formData.lista_precios_objetivo_id || ''}
                onChange={(e) => setFormData({ ...formData, lista_precios_objetivo_id: parseInt(e.target.value) })}
                className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-neutral-900 outline-none transition focus:border-brand-red/60 focus:shadow-[0_0_0_4px_rgba(240,65,45,0.18)]"
              >
                <option value="">Selecciona una lista</option>
                {listasPrecios.map((lista) => (
                  <option key={lista.id} value={lista.id}>
                    {lista.nombre}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <label className="text-xs text-neutral-600">Tipo de descuento</label>
              <select
                value={formData.tipo_descuento}
                onChange={(e) => setFormData({ ...formData, tipo_descuento: e.target.value as any })}
                className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-neutral-900 outline-none transition focus:border-brand-red/60 focus:shadow-[0_0_0_4px_rgba(240,65,45,0.18)]"
              >
                <option value="PORCENTAJE">Porcentaje</option>
                <option value="MONTO_FIJO">Monto fijo</option>
              </select>
            </div>

            <TextField
              label="Valor del descuento"
              tone="light"
              type="number"
              step="0.01"
              placeholder="Ej: 10"
              value={formData.valor_descuento}
              onChange={(e) =>
                setFormData({ ...formData, valor_descuento: parseFloat(e.target.value) || 0 })
              }
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="activo"
              checked={formData.activo}
              onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-brand-red focus:ring-brand-red"
            />
            <label htmlFor="activo" className="text-sm font-medium text-neutral-700">
              Campaña activa
            </label>
          </div>

          {editingCampania && (
            <div className="space-y-3 border-t border-gray-200 pt-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-gray-900">Productos asignados</h4>
                <button
                  type="button"
                  onClick={() => handleOpenProductModal(editingCampania)}
                  className="flex items-center gap-1 text-sm text-brand-red hover:text-brand-red/80"
                >
                  Gestionar productos
                </button>
              </div>
              <p className="text-xs text-gray-500">
                Guarda la campaña primero, luego gestiona sus productos desde la tarjeta.
              </p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              onClick={handleCloseModal}
              className="bg-neutral-200 text-neutral-700 hover:bg-neutral-300"
            >
              Cancelar
            </Button>
            <Button type="submit" className="bg-brand-red text-white hover:bg-brand-red/90">
              {editingCampania ? 'Actualizar' : 'Crear campaña'}
            </Button>
          </div>
        </form>
      </Modal>

      <ProductSelectorModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        productos={productos}
        productosAsignados={productosAsignados}
        onAddProduct={handleAddProduct}
        onDeleteProduct={handleDeleteProduct}
      />

      <Modal
        isOpen={isDetailModalOpen}
        title={selectedCampania?.nombre || 'Detalles de Campaña'}
        onClose={() => setIsDetailModalOpen(false)}
        headerGradient="red"
        maxWidth="lg"
      >
        {selectedCampania && (
          <div className="space-y-6">
            {/* Información general */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900">Información General</h3>
              <div className="grid gap-3 text-sm">
                {selectedCampania.descripcion && (
                  <div>
                    <span className="text-gray-600">Descripción:</span>
                    <p className="mt-1 text-gray-900">{selectedCampania.descripcion}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-gray-600">Fecha inicio:</span>
                    <p className="font-medium text-gray-900">
                      {new Date(selectedCampania.fecha_inicio).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Fecha fin:</span>
                    <p className="font-medium text-gray-900">
                      {new Date(selectedCampania.fecha_fin).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-gray-600">Tipo de descuento:</span>
                    <p className="font-medium text-gray-900">
                      {selectedCampania.tipo_descuento === 'PORCENTAJE' ? 'Porcentaje' : 'Monto fijo'}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Valor:</span>
                    <p className="font-semibold text-orange-600">
                      {selectedCampania.tipo_descuento === 'PORCENTAJE'
                        ? `${selectedCampania.valor_descuento}%`
                        : `$${selectedCampania.valor_descuento}`}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-gray-600">Alcance:</span>
                    <p className="font-medium text-gray-900">
                      {selectedCampania.alcance === 'GLOBAL'
                        ? 'General'
                        : selectedCampania.alcance === 'POR_LISTA'
                        ? 'Por lista de precios'
                        : 'Por cliente específico'}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Estado:</span>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${
                        selectedCampania.activo
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {selectedCampania.activo ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Productos asignados */}
            <div className="space-y-3 border-t border-gray-200 pt-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">
                  Productos en Promoción ({productosAsignados.length})
                </h3>
              </div>

              {productosAsignados.length === 0 ? (
                <div className="rounded-lg bg-gray-50 p-8 text-center">
                  <p className="text-sm text-gray-500">No hay productos asignados a esta campaña</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {productosAsignados.map((pp) => (
                    <div
                      key={pp.producto_id}
                      className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 hover:border-gray-300"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {pp.producto?.nombre || pp.producto_id}
                        </p>
                        {pp.producto?.codigo_sku && (
                          <p className="text-xs text-gray-500">SKU: {pp.producto.codigo_sku}</p>
                        )}
                      </div>
                      {pp.precio_oferta_fijo && (
                        <div className="mr-4 text-right">
                          <p className="text-sm text-gray-600">Precio promocional</p>
                          <p className="text-lg font-semibold text-orange-600">
                            ${pp.precio_oferta_fijo}
                          </p>
                        </div>
                      )}
                      <button
                        onClick={() => handleDeleteProduct(pp.producto_id)}
                        className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                        title="Eliminar de la campaña"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Clientes asignados (solo para campañas POR_CLIENTE) */}
            {selectedCampania.alcance === 'POR_CLIENTE' && (
              <div className="space-y-3 border-t border-gray-200 pt-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">
                    Clientes Asignados ({clientesAsignados.length})
                  </h3>
                </div>

                {clientesAsignados.length === 0 ? (
                  <div className="rounded-lg bg-gray-50 p-8 text-center">
                    <p className="text-sm text-gray-500">No hay clientes asignados a esta campaña</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {clientesAsignados.map((cc) => (
                      <div
                        key={cc.cliente_id}
                        className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 hover:border-gray-300"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            {cc.cliente?.razon_social || cc.cliente_id}
                          </p>
                          {cc.cliente?.identificacion && (
                            <p className="text-xs text-gray-500">
                              ID: {cc.cliente.identificacion}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={async () => {
                            const confirmDelete = window.confirm(
                              `¿Desea eliminar a ${cc.cliente?.razon_social || 'este cliente'} de la campaña?`
                            )
                            if (confirmDelete && selectedCampania) {
                              try {
                                await deleteClienteCampania(selectedCampania.id, cc.cliente_id)
                                const clientes = await getClientesByCampania(selectedCampania.id)
                                setClientesAsignados(clientes)
                                setSuccessMessage('✓ Cliente eliminado de la campaña')
                                setTimeout(() => setSuccessMessage(''), 3000)
                              } catch (err) {
                                console.error('Error al eliminar cliente:', err)
                              }
                            }
                          }}
                          className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                          title="Eliminar de la campaña"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end border-t border-gray-200 pt-4">
              <Button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="bg-neutral-200 text-neutral-700 hover:bg-neutral-300"
              >
                Cerrar
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <ClienteSelectorModal
        isOpen={isClientModalOpen}
        onClose={() => setIsClientModalOpen(false)}
        campaniaId={campaniaIdForClientes || 0}
        clientesAsignados={clientesAsignados}
        onAddCliente={handleAddCliente}
        onDeleteCliente={handleDeleteCliente}
      />
    </div>
  )
}

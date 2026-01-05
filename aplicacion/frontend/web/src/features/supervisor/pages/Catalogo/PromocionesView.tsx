import { useState, useEffect } from 'react'
import { Button } from 'components/ui/Button'
import { Alert } from 'components/ui/Alert'
import { LoadingSpinner } from 'components/ui/LoadingSpinner'
import { Percent, PlusCircle } from 'lucide-react'
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
import { obtenerListasPrecios, type ListaPrecio } from '../../services/clientesApi'
import { getAllProducts, type Product } from '../../services/productosApi'
import { CampaniaCard } from '../../components/CampaniaCard'
import { ProductSelectorModal } from '../../components/ProductSelectorModal'
import ClienteSelectorModal from '../../components/ClienteSelectorModal'
import { PromocionesFilters } from '../../components/PromocionesFilters'
import { CampaniaFormModal } from '../../components/CampaniaFormModal'
import { CampaniaDetailModal } from '../../components/CampaniaDetailModal'

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
  }, [])

  const loadProductos = async () => {
    try {
      const data = await getAllProducts()
      setProductos(data)
    } catch (err) {
      console.error('Error al cargar productos:', err)
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

  const handleDeleteClienteFromDetail = async (clienteId: string) => {
    if (!selectedCampania) return

    const confirmDelete = window.confirm('¿Eliminar este cliente de la campaña?')
    if (!confirmDelete) return

    try {
      await deleteClienteCampania(selectedCampania.id, clienteId)
      const clientes = await getClientesByCampania(selectedCampania.id)
      setClientesAsignados(clientes)
      setSuccessMessage('✓ Cliente eliminado de la campaña')
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (err: any) {
      console.error('Error al eliminar cliente:', err)
      alert(err.message || 'Error al eliminar cliente')
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

    if (campania.alcance === 'POR_CLIENTE') {
      try {
        const clientes = await getClientesByCampania(campania.id)
        setClientesAsignados(clientes)
      } catch (err) {
        console.error('Error al cargar clientes de la campaña:', err)
        setClientesAsignados([])
      }
    }

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
      <PromocionesFilters
        filtroEstado={filtroEstado}
        filtroAlcance={filtroAlcance}
        onEstadoChange={(valor) => setFiltroEstado(valor)}
        onAlcanceChange={(valor) => setFiltroAlcance(valor)}
      />

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

      <CampaniaFormModal
        isOpen={isModalOpen}
        editingCampania={editingCampania}
        formData={formData}
        listasPrecios={listasPrecios}
        onChange={(data) => setFormData(data)}
        onSubmit={handleSubmit}
        onClose={handleCloseModal}
        onManageProducts={editingCampania ? () => handleOpenProductModal(editingCampania) : undefined}
      />

      <ProductSelectorModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        productos={productos}
        productosAsignados={productosAsignados}
        onAddProduct={handleAddProduct}
        onDeleteProduct={handleDeleteProduct}
      />

      <CampaniaDetailModal
        isOpen={isDetailModalOpen}
        campania={selectedCampania}
        productosAsignados={productosAsignados}
        clientesAsignados={clientesAsignados}
        onClose={() => setIsDetailModalOpen(false)}
        onDeleteProduct={(productoId) => handleDeleteProduct(productoId)}
        onDeleteCliente={(clienteId) => handleDeleteClienteFromDetail(clienteId)}
      />

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

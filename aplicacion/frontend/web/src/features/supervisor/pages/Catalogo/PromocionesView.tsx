import { Button } from 'components/ui/Button'
import { Alert } from 'components/ui/Alert'
import { LoadingSpinner } from 'components/ui/LoadingSpinner'
import { NotificationStack } from 'components/ui/NotificationStack'
import { PlusCircle } from 'lucide-react'
import { ProductSelectorModal } from '../../components/ProductSelectorModal'
import ClienteSelectorModal from '../../components/ClienteSelectorModal'
import { CampaniaDetailModal } from '../../components/CampaniaDetailModal'
import { PromocionesList } from './promociones/PromocionesList'
import { PromocionesForm } from './promociones/PromocionesForm'
import { usePromocionesCrud } from '../../services/usePromocionesCrud'
import { usePromocionesProductos } from '../../services/usePromocionesProductos'
import { usePromocionesClientes } from '../../services/usePromocionesClientes'
import { useNotification } from '../../../../hooks/useNotification'
import { useState, useEffect } from 'react'
import { getAllListasPrecios } from '../../services/preciosApi'

export function PromocionesView() {
  // CRUD campañas
  const {
    campanias,
    isLoading,
    error,
    successMessage,
    create,
    update,
    remove,
    reload,
  } = usePromocionesCrud()

  // Notificaciones
  const { notifications, success, error: notifyError, remove: removeNotification } = useNotification()

  // Estados UI y datos de edición
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCampania, setEditingCampania] = useState<any | null>(null)
  const [formData, setFormData] = useState<any>({ nombre: '', descripcion: '', fecha_inicio: '', fecha_fin: '', tipo_descuento: 'PORCENTAJE', valor_descuento: 0, alcance: 'GLOBAL', activo: true })
  const [listasPrecios, setListasPrecios] = useState<any[]>([])
  const [filtroEstado, setFiltroEstado] = useState<'todas' | 'activas' | 'inactivas'>('todas')
  const [filtroAlcance, setFiltroAlcance] = useState<'todos' | 'GLOBAL' | 'POR_LISTA' | 'POR_CLIENTE'>('todos')
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [selectedCampania, setSelectedCampania] = useState<any | null>(null)

  // Cargar listas de precios al abrir el modal
  useEffect(() => {
    if (isModalOpen) {
      getAllListasPrecios()
        .then((listas) => setListasPrecios(listas))
        .catch(() => setListasPrecios([]))
    }
  }, [isModalOpen])

  // Productos de campaña
  const {
    productos,
    productosPromo: productosAsignados,
    isLoading: isProductLoading,
    loadProductos,
    loadProductosPromo,
    addProducto,
    removeProducto,
  } = usePromocionesProductos()

  // Clientes de campaña
  const {
    clientesCampania: clientesAsignados,
    isLoading: isClientLoading,
    loadClientesCampania,
    addCliente,
    removeCliente,
  } = usePromocionesClientes()

  // Estados para modales
  const [campaniaIdForClientes, setCampaniaIdForClientes] = useState<number | null>(null)
  const [isProductModalOpen, setIsProductModalOpen] = useState(false)
  const [isClientModalOpen, setIsClientModalOpen] = useState(false)

  // Métodos para abrir/cerrar modales y cargar datos
  const handleOpenModal = (campania?: any) => {
    if (campania) {
      setEditingCampania(campania)
      setFormData({ ...campania })
    } else {
      setEditingCampania(null)
      setFormData({ nombre: '', descripcion: '', fecha_inicio: '', fecha_fin: '', tipo_descuento: 'PORCENTAJE', valor_descuento: 0, alcance: 'GLOBAL', activo: true })
    }
    setIsModalOpen(true)
  }
  const handleCloseModal = () => setIsModalOpen(false)

  const handleViewDetails = async (campania: any) => {
    setSelectedCampania(campania)
    await loadProductosPromo(campania.id)
    if (campania.alcance === 'POR_CLIENTE') {
      await loadClientesCampania(campania.id)
    }
    setIsDetailModalOpen(true)
  }
  const closeDetailModal = () => setIsDetailModalOpen(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // Limpiar y tipar correctamente los datos antes de enviar
    const cleanFormData: any = {
      nombre: formData.nombre,
      descripcion: formData.descripcion,
      fecha_inicio: formData.fecha_inicio,
      fecha_fin: formData.fecha_fin,
      tipo_descuento: formData.tipo_descuento,
      valor_descuento: formData.valor_descuento ? Number(formData.valor_descuento) : undefined,
      alcance: formData.alcance,
      lista_precios_objetivo_id: formData.alcance === 'POR_LISTA' ? Number(formData.lista_precios_objetivo_id) : undefined,
      imagen_banner_url: formData.imagen_banner_url,
      activo: !!formData.activo,
    };
    if (editingCampania) {
      await update(editingCampania.id, cleanFormData)
    } else {
      await create(cleanFormData)
    }
    setIsModalOpen(false)
    reload()
  }
  const handleDelete = async (id: string | number) => {
    await remove(id)
    reload()
  }

  // Productos
  const handleOpenProductModal = async (campania: any) => {
    setEditingCampania(campania)
    setIsProductModalOpen(true)
    await loadProductos();
    await loadProductosPromo(campania.id);
  }
  const closeProductModal = () => setIsProductModalOpen(false)
  const handleAddProduct = async (productoId: string, precioOferta?: number) => {
    if (!editingCampania) return
    const result = await addProducto(editingCampania.id, productoId)
    if (result.success) {
      success(result.message)
    } else {
      notifyError(result.message)
    }
    await loadProductosPromo(editingCampania.id)
  }
  const handleDeleteProduct = async (productoId: string) => {
    if (!editingCampania) return
    const result = await removeProducto(editingCampania.id, productoId)
    if (result.success) {
      success(result.message)
    } else {
      notifyError(result.message)
    }
    await loadProductosPromo(editingCampania.id)
  }

  // Clientes
  const handleOpenClientModal = async (campaniaId: number) => {
    setCampaniaIdForClientes(campaniaId)
    setIsClientModalOpen(true)
    await loadClientesCampania(campaniaId)
  }
  const closeClientModal = () => setIsClientModalOpen(false)
  const handleAddCliente = async (clienteId: string) => {
    if (!campaniaIdForClientes) return
    await addCliente(campaniaIdForClientes, clienteId)
    await loadClientesCampania(campaniaIdForClientes)
  }
  const handleDeleteCliente = async (clienteId: string) => {
    if (!campaniaIdForClientes) return
    await removeCliente(campaniaIdForClientes, clienteId)
    await loadClientesCampania(campaniaIdForClientes)
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
      <NotificationStack notifications={notifications} onRemove={removeNotification} />
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Campañas Promocionales</h2>
          <p className="mt-1 text-sm text-gray-600">Administra ofertas y descuentos especiales</p>
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

      <PromocionesList
        campanias={campanias}
        isLoading={isLoading}
        filtroEstado={filtroEstado}
        filtroAlcance={filtroAlcance}
        onEstadoChange={(valor) => setFiltroEstado(valor)}
        onAlcanceChange={(valor) => setFiltroAlcance(valor)}
        onEdit={(campania) => handleOpenModal(campania)}
        onDelete={(id) => handleDelete(id)}
        onViewDetails={(campania) => handleViewDetails(campania)}
        onAddProducts={(campania) => handleOpenProductModal(campania)}
        onAddClientes={(campania) => handleOpenClientModal(campania.id)}
      />

      <PromocionesForm
        isOpen={isModalOpen}
        editingCampania={editingCampania ?? null}
        formData={formData ?? { nombre: '', descripcion: '', fecha_inicio: '', fecha_fin: '', tipo_descuento: 'PORCENTAJE', valor_descuento: 0, alcance: 'GLOBAL', activo: true }}
        listasPrecios={listasPrecios ?? []}
        onChange={(data) => setFormData(data)}
        onSubmit={handleSubmit}
        onClose={handleCloseModal}
        onManageProducts={editingCampania ? () => handleOpenProductModal(editingCampania) : undefined}
      />

      <ProductSelectorModal
        isOpen={isProductModalOpen}
        onClose={closeProductModal}
        productos={productos}
        productosAsignados={productosAsignados}
        onAddProduct={handleAddProduct}
        onDeleteProduct={handleDeleteProduct}
        hideAssigned
        notifications={notifications}
        onRemoveNotification={removeNotification}
      />

      <CampaniaDetailModal
        isOpen={isDetailModalOpen}
        campania={selectedCampania}
        productosAsignados={productosAsignados}
        clientesAsignados={clientesAsignados}
        onClose={closeDetailModal}
        onDeleteProduct={(productoId) => handleDeleteProduct(productoId)}
        // onDeleteCliente no implementado en modularización actual
      />

      <ClienteSelectorModal
        isOpen={isClientModalOpen}
        onClose={closeClientModal}
        campaniaId={campaniaIdForClientes || 0}
        clientesAsignados={clientesAsignados}
        onAddCliente={handleAddCliente}
        onDeleteCliente={handleDeleteCliente}
      />
    </div>
  )
}

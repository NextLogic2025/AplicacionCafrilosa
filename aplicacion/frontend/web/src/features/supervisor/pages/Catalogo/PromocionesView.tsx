import { Button } from 'components/ui/Button'
import { Alert } from 'components/ui/Alert'
import { LoadingSpinner } from 'components/ui/LoadingSpinner'
import { PlusCircle } from 'lucide-react'
import { ProductSelectorModal } from '../../components/ProductSelectorModal'
import ClienteSelectorModal from '../../components/ClienteSelectorModal'
import { CampaniaDetailModal } from '../../components/CampaniaDetailModal'
import { PromocionesList } from './PromocionesList'
import { PromocionesForm } from './PromocionesForm'
import { usePromocionesController } from './usePromocionesController'

export function PromocionesView() {
  const {
    campanias,
    isLoading,
    error,
    successMessage,
    isModalOpen,
    editingCampania,
    listasPrecios,
    productos,
    productosAsignados,
    isProductModalOpen,
    isClientModalOpen,
    campaniaIdForClientes,
    clientesAsignados,
    filtroEstado,
    filtroAlcance,
    isDetailModalOpen,
    selectedCampania,
    formData,
    setFiltroEstado,
    setFiltroAlcance,
    handleOpenModal,
    handleCloseModal,
    handleOpenProductModal,
    handleOpenClientModal,
    handleAddCliente,
    handleDeleteCliente,
    handleDeleteClienteFromDetail,
    handleAddProduct,
    handleDeleteProduct,
    handleViewDetails,
    handleSubmit,
    handleDelete,
    setFormData,
    closeProductModal,
    closeClientModal,
    closeDetailModal,
  } = usePromocionesController()

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
        onClose={closeProductModal}
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
        onClose={closeDetailModal}
        onDeleteProduct={(productoId) => handleDeleteProduct(productoId)}
        onDeleteCliente={(clienteId) => handleDeleteClienteFromDetail(clienteId)}
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

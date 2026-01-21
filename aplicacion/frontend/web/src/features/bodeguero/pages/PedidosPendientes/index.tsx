
import { ClipboardList } from 'lucide-react'
import { LoadingSpinner } from 'components/ui/LoadingSpinner'
import { Alert } from 'components/ui/Alert'

import { usePedidosPendientes } from './hooks/usePedidosPendientes'
import { PendingOrdersHeader } from './components/PendingOrdersHeader'
import { PedidoFilters } from './components/PedidoFilters'
import { PendingOrdersTable } from './components/PendingOrdersTable'
import { OrderDetailsModal } from './components/OrderDetailsModal'

export default function PedidosPage() {
  const {
    isLoading,
    error,
    filtroEstado,
    setFiltroEstado,
    searchTerm,
    setSearchTerm,
    toast,
    pedidoDetalle,
    setPedidoDetalle,
    isLoadingDetalle,
    pedidosFiltrados,
    handleVerDetalle,
    handleIniciarPreparacion,
    getEstadoBadgeColor,
    formatCurrency,
    formatDate
  } = usePedidosPendientes()

  return (
    <div className="space-y-6">
      <PendingOrdersHeader />

      {/* Toast Notifications */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 rounded-lg px-4 py-3 shadow-lg ${toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
          }`}>
          {toast.message}
        </div>
      )}

      {/* Filtros y búsqueda */}
      <PedidoFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filtroEstado={filtroEstado}
        setFiltroEstado={setFiltroEstado}
      />

      {/* Error Alert */}
      {error && <Alert type="error" message={error} />}

      {/* Contenido */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : pedidosFiltrados.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-neutral-300 bg-neutral-50 p-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-neutral-200">
            <ClipboardList className="h-8 w-8 text-neutral-500" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-neutral-900">
            No hay pedidos
          </h3>
          <p className="mt-2 text-sm text-neutral-600">
            {searchTerm || filtroEstado !== 'TODOS'
              ? 'No se encontraron pedidos con los filtros aplicados'
              : 'Los pedidos aparecerán aquí cuando estén disponibles'}
          </p>
        </div>
      ) : (
        <PendingOrdersTable
          pedidos={pedidosFiltrados}
          handleVerDetalle={handleVerDetalle}
          handleIniciarPreparacion={handleIniciarPreparacion}
          getEstadoBadgeColor={getEstadoBadgeColor}
          formatCurrency={formatCurrency}
          formatDate={formatDate}
        />
      )}

      {/* Modal de Detalle */}
      <OrderDetailsModal
        isOpen={!!pedidoDetalle}
        onClose={() => setPedidoDetalle(null)}
        pedido={pedidoDetalle}
        isLoading={isLoadingDetalle}
        getEstadoBadgeColor={getEstadoBadgeColor}
        formatCurrency={formatCurrency}
        formatDate={formatDate}
        handleIniciarPreparacion={handleIniciarPreparacion}
        setPedidoDetalle={setPedidoDetalle}
      />
    </div>
  )
}

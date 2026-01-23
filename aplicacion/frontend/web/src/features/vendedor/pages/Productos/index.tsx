
import { PageHero } from '../../../../components/ui/PageHero'
import { EmptyContent } from '../../../../components/ui/EmptyContent'
import { ProductCard } from '../../../../components/ui/ProductCard'
import { Package } from 'lucide-react'
import ProductDetailModal from '../../../cliente/components/ProductDetailModal'

import { useProductos } from './hooks/useProductos'
import { ClientSelector } from './components/ClientSelector'
import { ProductFilters } from './components/ProductFilters'
import { CartToast } from './components/CartToast'

export default function VendedorProductos() {
  const {
    productos,
    productosFiltrados,
    loading,
    busqueda,
    setBusqueda,
    mostrarFiltros,
    setMostrarFiltros,
    filtros,
    setFiltros,
    categories,
    categoryId,
    setCategoryId,
    clientes,
    clienteSeleccionado,
    setClienteSeleccionado,
    loadingClientes,
    selectedProducto,
    isDetailOpen,
    openDetail,
    closeDetail,
    cart,
    setCart,
    showToast,
    setShowToast,
    lastAddedProduct,
    addToCart,
    goToCrearPedido
  } = useProductos()

  return (
    <div className="space-y-6">
      <PageHero
        title="Catálogo de Productos"
        subtitle="Explora el catálogo completo para crear pedidos"
        chips={[
          { label: 'Solo lectura', variant: 'neutral' },
          { label: 'Precios base', variant: 'blue' },
        ]}
      />

      <CartToast
        showToast={showToast}
        lastAddedProduct={lastAddedProduct}
        cart={cart}
        setCart={setCart}
        setShowToast={setShowToast}
        goToCrearPedido={goToCrearPedido}
      />

      <div className="rounded-xl border border-neutral-200 bg-white p-6">
        <ClientSelector
          clientes={clientes}
          clienteSeleccionado={clienteSeleccionado}
          setClienteSeleccionado={setClienteSeleccionado}
          loadingClientes={loadingClientes}
        />

        <ProductFilters
          busqueda={busqueda}
          setBusqueda={setBusqueda}
          mostrarFiltros={mostrarFiltros}
          setMostrarFiltros={setMostrarFiltros}
          filtros={filtros}
          setFiltros={setFiltros}
          categories={categories}
          categoryId={categoryId}
          setCategoryId={setCategoryId}
        />
      </div>

      <section className="rounded-xl border border-neutral-200 bg-white p-6">
        <h3 className="text-lg font-bold text-neutral-950 mb-4">Catálogo Completo</h3>
        {loading ? (
          <div className="flex justify-center items-center h-32">Cargando productos...</div>
        ) : productos.length === 0 ? (
          <EmptyContent
            icon={<Package className="h-16 w-16" />}
            title="No hay productos disponibles"
            description="El catálogo de productos se cargará desde el backend"
          />
        ) : (
          <div>
            {productosFiltrados.length === 0 ? (
              <div className="p-6 text-center text-sm text-gray-600">No se encontraron productos con los filtros seleccionados.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {productosFiltrados.map((producto) => (
                  <ProductCard
                    key={producto.id}
                    producto={producto}
                    onAddToCart={() => addToCart(producto)}
                    onView={openDetail}
                    fetchPromos
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-orange-200 bg-orange-50 p-6">
        <h4 className="font-semibold text-orange-900 mb-2">Limitaciones del Rol</h4>
        <ul className="text-sm text-orange-800 space-y-1">
          <li>✗ No puedes cambiar precios</li>
          <li>✗ No puedes crear productos</li>
          <li>✓ Visualiza precios base y presentaciones</li>
          <li>✓ Los productos se usan al crear pedidos</li>
        </ul>
      </section>

      {selectedProducto && (
        <ProductDetailModal
          producto={selectedProducto}
          isOpen={isDetailOpen}
          onClose={closeDetail}
          onAddToCart={() => { }}
        />
      )}
    </div>
  )
}

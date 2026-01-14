import { PageHero } from '../../../../components/ui/PageHero'
import { EmptyContent } from '../../../../components/ui/EmptyContent'
import { Package, Search } from 'lucide-react'

export default function VendedorProductos() {
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

      {/* Filtros */}
      <section className="rounded-xl border border-neutral-200 bg-white p-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Buscar Producto
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <input
                type="text"
                placeholder="Nombre o código..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent"
              />
            </div>
          </div>

          <div className="w-48">
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Categoría
            </label>
            <select className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent">
              <option value="">Todas</option>
              <option value="lacteos">Lácteos</option>
              <option value="bebidas">Bebidas</option>
              <option value="snacks">Snacks</option>
            </select>
          </div>

          <div className="w-48">
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Presentación
            </label>
            <select className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent">
              <option value="">Todas</option>
              <option value="unidad">Unidad</option>
              <option value="caja">Caja</option>
              <option value="pallet">Pallet</option>
            </select>
          </div>
        </div>
      </section>

      {/* Catálogo */}
      <section className="rounded-xl border border-neutral-200 bg-white p-6">
        <h3 className="text-lg font-bold text-neutral-950 mb-4">Catálogo Completo</h3>
        <EmptyContent
          icon={<Package className="h-16 w-16" />}
          title="No hay productos disponibles"
          description="El catálogo de productos se cargará desde el backend"
        />
      </section>

      {/* Información */}
      <section className="rounded-xl border border-orange-200 bg-orange-50 p-6">
        <h4 className="font-semibold text-orange-900 mb-2">Limitaciones del Rol</h4>
        <ul className="text-sm text-orange-800 space-y-1">
          <li>✗ No puedes cambiar precios</li>
          <li>✗ No puedes crear productos</li>
          <li>✓ Visualiza precios base y presentaciones</li>
          <li>✓ Los productos se usan al crear pedidos</li>
        </ul>
      </section>
    </div>
  )
}

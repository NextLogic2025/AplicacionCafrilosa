import { PageHero } from '../../../../components/ui/PageHero'
import { StatusBadge } from '../../../../components/ui/StatusBadge'
import { EmptyContent } from '../../../../components/ui/EmptyContent'
import { ClipboardList, Search } from 'lucide-react'

export default function VendedorPedidos() {
  return (
    <div className="space-y-6">
      <PageHero
        title="Mis Pedidos"
        subtitle="Seguimiento de pedidos creados"
        chips={[
          { label: 'Trazabilidad completa', variant: 'blue' },
          { label: 'Cliente y vendedor', variant: 'green' },
        ]}
      />

      {/* Filtros */}
      <section className="rounded-xl border border-neutral-200 bg-white p-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Buscar Pedido
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <input
                type="text"
                placeholder="Número de pedido o cliente..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent"
              />
            </div>
          </div>

          <div className="w-48">
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Origen
            </label>
            <select className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent">
              <option value="">Todos</option>
              <option value="vendedor">Creado por mí</option>
              <option value="cliente">Creado por cliente</option>
            </select>
          </div>

          <div className="w-48">
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Estado
            </label>
            <select className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent">
              <option value="">Todos</option>
              <option value="pendiente">Pendiente</option>
              <option value="aprobado">Aprobado</option>
              <option value="rechazado">Rechazado</option>
              <option value="facturado">Facturado</option>
              <option value="en-ruta">En Ruta</option>
              <option value="entregado">Entregado</option>
            </select>
          </div>
        </div>
      </section>

      {/* Lista de Pedidos */}
      <section className="rounded-xl border border-neutral-200 bg-white p-6">
        <h3 className="text-lg font-bold text-neutral-950 mb-4">Pedidos Recientes</h3>
        <EmptyContent
          icon={<ClipboardList className="h-16 w-16" />}
          title="No hay pedidos registrados"
          description="Los pedidos que crees o que tus clientes generen aparecerán aquí"
        />
      </section>

      {/* Leyenda de Estados */}
      <section className="rounded-xl border border-neutral-200 bg-white p-6">
        <h4 className="font-semibold text-neutral-950 mb-3">Estados del Pedido</h4>
        <div className="flex flex-wrap gap-3">
          <StatusBadge variant="warning">Pendiente Validación</StatusBadge>
          <StatusBadge variant="success">Aprobado por Bodega</StatusBadge>
          <StatusBadge variant="error">Rechazado</StatusBadge>
          <StatusBadge variant="info">Facturado</StatusBadge>
          <StatusBadge variant="neutral">En Ruta</StatusBadge>
        </div>
      </section>

      {/* Información */}
      <section className="rounded-xl border border-blue-200 bg-blue-50 p-6">
        <h4 className="font-semibold text-blue-900 mb-2">Línea de Tiempo del Pedido</h4>
        <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
          <li>Pedido creado (por vendedor o cliente)</li>
          <li>Enviado a bodega para validación</li>
          <li>Bodega valida stock (aprueba o rechaza)</li>
          <li>ERP genera factura (si fue aprobado)</li>
          <li>Asignado a transportista</li>
          <li>En ruta de entrega</li>
          <li>Entregado al cliente</li>
        </ol>
      </section>
    </div>
  )
}

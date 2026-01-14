import { PageHero } from '../../../../components/ui/PageHero'
import { StatusBadge } from '../../../../components/ui/StatusBadge'
import { EmptyContent } from '../../../../components/ui/EmptyContent'
import { Bell } from 'lucide-react'

export default function VendedorNotificaciones() {
  return (
    <div className="space-y-6">
      <PageHero
        title="Notificaciones"
        subtitle="Mantente informado sobre tus pedidos y clientes"
        chips={[
          { label: 'Alertas en tiempo real', variant: 'blue' },
          { label: 'Seguimiento', variant: 'green' },
        ]}
      />

      {/* Filtros */}
      <section className="rounded-xl border border-neutral-200 bg-white p-6">
        <div className="flex flex-wrap gap-4">
          <div className="w-48">
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Tipo
            </label>
            <select className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent">
              <option value="">Todas</option>
              <option value="pedido">Pedidos</option>
              <option value="factura">Facturas</option>
              <option value="entrega">Entregas</option>
              <option value="cliente">Clientes</option>
            </select>
          </div>

          <div className="w-48">
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Estado
            </label>
            <select className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent">
              <option value="">Todas</option>
              <option value="no-leida">No leídas</option>
              <option value="leida">Leídas</option>
            </select>
          </div>
        </div>
      </section>

      {/* Lista de Notificaciones */}
      <section className="rounded-xl border border-neutral-200 bg-white p-6">
        <h3 className="text-lg font-bold text-neutral-950 mb-4">Notificaciones Recientes</h3>
        <EmptyContent
          icon={<Bell className="h-16 w-16" />}
          title="No hay notificaciones"
          description="Recibirás alertas sobre pedidos, facturas y entregas"
        />
      </section>

      {/* Tipos de Notificaciones */}
      <section className="rounded-xl border border-blue-200 bg-blue-50 p-6">
        <h4 className="font-semibold text-blue-900 mb-2">Tipos de Notificaciones</h4>
        <ul className="text-sm text-blue-800 space-y-2">
          <li className="flex items-start gap-2">
            <StatusBadge variant="success">Aprobado</StatusBadge>
            <span>Pedido aprobado por bodega</span>
          </li>
          <li className="flex items-start gap-2">
            <StatusBadge variant="error">Rechazado</StatusBadge>
            <span>Pedido rechazado por falta de stock</span>
          </li>
          <li className="flex items-start gap-2">
            <StatusBadge variant="info">Factura</StatusBadge>
            <span>Factura generada por el ERP</span>
          </li>
          <li className="flex items-start gap-2">
            <StatusBadge variant="neutral">Entrega</StatusBadge>
            <span>Pedido entregado al cliente</span>
          </li>
          <li className="flex items-start gap-2">
            <StatusBadge variant="warning">Alerta</StatusBadge>
            <span>Factura vencida de cliente</span>
          </li>
        </ul>
      </section>

      {/* Información */}
      <section className="rounded-xl border border-neutral-200 bg-white p-6">
        <h4 className="font-semibold text-neutral-950 mb-2">Beneficios</h4>
        <ul className="text-sm text-neutral-700 space-y-1">
          <li>✓ Mantente informado en tiempo real</li>
          <li>✓ Responde rápidamente a rechazos de pedidos</li>
          <li>✓ Comunica proactivamente con tus clientes</li>
          <li>✓ Mejora tu servicio comercial</li>
        </ul>
      </section>
    </div>
  )
}

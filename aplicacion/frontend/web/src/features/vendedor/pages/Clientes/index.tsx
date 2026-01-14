import { PageHero } from '../../../../components/ui/PageHero'
import { ActionButton } from '../../../../components/ui/ActionButton'
import { StatusBadge } from '../../../../components/ui/StatusBadge'
import { EmptyContent } from '../../../../components/ui/EmptyContent'
import { Users, Plus, Search, UserPlus } from 'lucide-react'

export default function VendedorClientes() {
  return (
    <div className="space-y-6">
      <PageHero
        title="Mis Clientes"
        subtitle="Gestiona tu cartera de clientes asignados"
        chips={[
          { label: 'Cartera asignada', variant: 'blue' },
          { label: 'Registro de prospectos', variant: 'green' },
        ]}
      />

      {/* Acciones */}
      <section className="flex flex-wrap gap-3">
        <ActionButton variant="primary" icon={<UserPlus className="h-4 w-4" />}>
          Registrar Prospecto
        </ActionButton>
        <ActionButton variant="secondary" icon={<Plus className="h-4 w-4" />}>
          Solicitar Alta de Cliente
        </ActionButton>
      </section>

      {/* Filtros */}
      <section className="rounded-xl border border-neutral-200 bg-white p-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Buscar Cliente
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <input
                type="text"
                placeholder="Razón social..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent"
              />
            </div>
          </div>

          <div className="w-48">
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Zona
            </label>
            <select className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent">
              <option value="">Todas</option>
              <option value="norte">Norte</option>
              <option value="sur">Sur</option>
              <option value="este">Este</option>
              <option value="oeste">Oeste</option>
            </select>
          </div>

          <div className="w-48">
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Estado Crediticio
            </label>
            <select className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent">
              <option value="">Todos</option>
              <option value="aprobado">Aprobado</option>
              <option value="bloqueado">Bloqueado</option>
              <option value="revision">En Revisión</option>
            </select>
          </div>
        </div>
      </section>

      {/* Lista de Clientes */}
      <section className="rounded-xl border border-neutral-200 bg-white p-6">
        <h3 className="text-lg font-bold text-neutral-950 mb-4">Cartera de Clientes</h3>
        <EmptyContent
          icon={<Users className="h-16 w-16" />}
          title="No hay clientes registrados"
          description="Los clientes asignados a tu cartera aparecerán aquí"
        />
      </section>

      {/* Información adicional */}
      <section className="rounded-xl border border-blue-200 bg-blue-50 p-6">
        <h4 className="font-semibold text-blue-900 mb-2">Gestión de Clientes</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>✓ Puedes registrar prospectos para futuras activaciones</li>
          <li>✓ La solicitud de alta requiere aprobación del supervisor</li>
          <li>✓ Visualiza el historial completo de pedidos y pagos de cada cliente</li>
          <li>✓ Inicia pedidos directamente desde la ficha del cliente</li>
        </ul>
      </section>
    </div>
  )
}

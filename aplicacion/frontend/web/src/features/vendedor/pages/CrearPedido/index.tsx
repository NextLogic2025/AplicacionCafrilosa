import { PageHero } from '../../../../components/ui/PageHero'
import { ActionButton } from '../../../../components/ui/ActionButton'
import { EmptyContent } from '../../../../components/ui/EmptyContent'
import { ShoppingCart, Users, Package, Percent, Send, Trash2 } from 'lucide-react'

export default function VendedorCrearPedido() {
  return (
    <div className="space-y-6">
      <PageHero
        title="Crear Pedido"
        subtitle="Módulo central para la gestión de ventas"
        chips={[
          { label: 'Módulo principal', variant: 'red' },
          { label: 'Gestión comercial', variant: 'blue' },
        ]}
      />

      {/* Selección de Cliente */}
      <section className="rounded-xl border border-neutral-200 bg-white p-6">
        <h3 className="text-lg font-bold text-neutral-950 mb-4 flex items-center gap-2">
          <Users className="h-5 w-5 text-brand-red" />
          1. Selecciona Cliente
        </h3>
        <div className="flex gap-3">
          <div className="flex-1">
            <select className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent">
              <option value="">Selecciona un cliente...</option>
            </select>
          </div>
          <ActionButton variant="secondary">
            Ver Detalles
          </ActionButton>
        </div>
        <p className="text-sm text-neutral-500 mt-2">
          Selecciona un cliente de tu cartera para iniciar el pedido
        </p>
      </section>

      {/* Agregar Productos */}
      <section className="rounded-xl border border-neutral-200 bg-white p-6">
        <h3 className="text-lg font-bold text-neutral-950 mb-4 flex items-center gap-2">
          <Package className="h-5 w-5 text-brand-red" />
          2. Agrega Productos
        </h3>
        <EmptyContent
          icon={<ShoppingCart className="h-16 w-16" />}
          title="Carrito vacío"
          description="Selecciona un cliente para comenzar a agregar productos"
        />
      </section>

      {/* Promociones */}
      <section className="rounded-xl border border-neutral-200 bg-white p-6">
        <h3 className="text-lg font-bold text-neutral-950 mb-4 flex items-center gap-2">
          <Percent className="h-5 w-5 text-brand-red" />
          3. Aplica Promociones
        </h3>
        <p className="text-sm text-neutral-500">
          Las promociones aplicables se mostrarán automáticamente según los productos seleccionados
        </p>
      </section>

      {/* Condición Comercial */}
      <section className="rounded-xl border border-neutral-200 bg-white p-6">
        <h3 className="text-lg font-bold text-neutral-950 mb-4">4. Define Condición Comercial</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Forma de Pago
            </label>
            <select className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent">
              <option value="">Seleccionar...</option>
              <option value="contado">Contado</option>
              <option value="credito">Crédito</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Días de Crédito
            </label>
            <input
              type="number"
              placeholder="0"
              className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent"
            />
          </div>
        </div>
      </section>

      {/* Resumen */}
      <section className="rounded-xl border border-brand-red bg-brand-red/5 p-6">
        <h3 className="text-lg font-bold text-neutral-950 mb-4">Resumen del Pedido</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-neutral-600">Subtotal:</span>
            <span className="font-semibold text-neutral-950">--</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-600">Descuentos:</span>
            <span className="font-semibold text-green-600">--</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-neutral-200">
            <span className="font-bold text-neutral-950">Total:</span>
            <span className="font-bold text-brand-red text-lg">--</span>
          </div>
        </div>
      </section>

      {/* Acciones */}
      <section className="flex flex-wrap gap-3">
        <ActionButton variant="primary" icon={<Send className="h-4 w-4" />}>
          Enviar Pedido a Bodega
        </ActionButton>
        <ActionButton variant="secondary">
          Guardar Borrador
        </ActionButton>
        <ActionButton variant="danger" icon={<Trash2 className="h-4 w-4" />}>
          Cancelar
        </ActionButton>
      </section>

      {/* Información */}
      <section className="rounded-xl border border-blue-200 bg-blue-50 p-6">
        <h4 className="font-semibold text-blue-900 mb-2">Flujo del Pedido</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>✓ Crea pedidos para clientes de tu cartera</li>
          <li>✓ Edita el carrito antes de enviar</li>
          <li>✓ El pedido se envía a bodega para validación de stock</li>
          <li>✗ No puedes validar stock directamente</li>
          <li>✗ La facturación la genera el ERP automáticamente</li>
        </ul>
      </section>
    </div>
  )
}

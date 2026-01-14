import { PageHero } from '../../../../components/ui/PageHero'
import { ActionButton } from '../../../../components/ui/ActionButton'
import { User, Mail, Phone, MapPin, Save } from 'lucide-react'

export default function VendedorPerfil() {
  return (
    <div className="space-y-6">
      <PageHero
        title="Mi Perfil"
        subtitle="Información personal y zona asignada"
        chips={[
          { label: 'Datos personales', variant: 'blue' },
          { label: 'Zona comercial', variant: 'green' },
        ]}
      />

      {/* Datos Personales */}
      <section className="rounded-xl border border-neutral-200 bg-white p-6">
        <h3 className="text-lg font-bold text-neutral-950 mb-4 flex items-center gap-2">
          <User className="h-5 w-5 text-brand-red" />
          Datos Personales
        </h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Nombre Completo
            </label>
            <input
              type="text"
              placeholder="Juan Pérez"
              className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2 flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email
            </label>
            <input
              type="email"
              placeholder="vendedor@cafrilosa.com"
              className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2 flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Teléfono
            </label>
            <input
              type="tel"
              placeholder="+51 999 999 999"
              className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              DNI
            </label>
            <input
              type="text"
              placeholder="12345678"
              className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent"
            />
          </div>
        </div>
      </section>

      {/* Zona Asignada */}
      <section className="rounded-xl border border-neutral-200 bg-white p-6">
        <h3 className="text-lg font-bold text-neutral-950 mb-4 flex items-center gap-2">
          <MapPin className="h-5 w-5 text-brand-red" />
          Zona Comercial Asignada
        </h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Zona
            </label>
            <input
              type="text"
              placeholder="Lima Norte"
              disabled
              className="w-full px-4 py-2 rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-500"
            />
            <p className="text-xs text-neutral-500 mt-1">
              Solo lectura - asignado por supervisor
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Clientes Asignados
            </label>
            <input
              type="text"
              placeholder="--"
              disabled
              className="w-full px-4 py-2 rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-500"
            />
          </div>
        </div>
      </section>

      {/* Estadísticas */}
      <section className="rounded-xl border border-neutral-200 bg-white p-6">
        <h3 className="text-lg font-bold text-neutral-950 mb-4">Estadísticas del Vendedor</h3>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="text-center p-4 rounded-lg bg-blue-50">
            <p className="text-3xl font-bold text-blue-600">--</p>
            <p className="text-sm text-blue-900 mt-1">Clientes en Cartera</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-green-50">
            <p className="text-3xl font-bold text-green-600">--</p>
            <p className="text-sm text-green-900 mt-1">Pedidos Este Mes</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-purple-50">
            <p className="text-3xl font-bold text-purple-600">--</p>
            <p className="text-sm text-purple-900 mt-1">Ventas Totales</p>
          </div>
        </div>
      </section>

      {/* Acciones */}
      <section className="flex gap-3">
        <ActionButton variant="primary" icon={<Save className="h-4 w-4" />}>
          Guardar Cambios
        </ActionButton>
        <ActionButton variant="secondary">
          Cancelar
        </ActionButton>
      </section>

      {/* Información */}
      <section className="rounded-xl border border-blue-200 bg-blue-50 p-6">
        <h4 className="font-semibold text-blue-900 mb-2">Información del Perfil</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>✓ Actualiza tus datos de contacto</li>
          <li>✓ Visualiza tu zona asignada</li>
          <li>✗ La zona solo puede ser modificada por el supervisor</li>
          <li>📌 Mantén tu información actualizada para mejor comunicación</li>
        </ul>
      </section>
    </div>
  )
}

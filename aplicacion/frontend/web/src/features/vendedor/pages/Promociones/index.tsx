import { PageHero } from '../../../../components/ui/PageHero'
import { EmptyContent } from '../../../../components/ui/EmptyContent'
import { Percent } from 'lucide-react'

export default function VendedorPromociones() {
  return (
    <div className="space-y-6">
      <PageHero
        title="Promociones Activas"
        subtitle="Aplica promociones al crear pedidos"
        chips={[
          { label: 'Solo lectura', variant: 'neutral' },
          { label: 'Aplicación automática', variant: 'green' },
        ]}
      />

      {/* Promociones Activas */}
      <section className="rounded-xl border border-neutral-200 bg-white p-6">
        <h3 className="text-lg font-bold text-neutral-950 mb-4">Promociones Vigentes</h3>
        <EmptyContent
          icon={<Percent className="h-16 w-16" />}
          title="No hay promociones activas"
          description="Las promociones vigentes se mostrarán aquí"
        />
      </section>

      {/* Información */}
      <section className="rounded-xl border border-blue-200 bg-blue-50 p-6">
        <h4 className="font-semibold text-blue-900 mb-2">Aplicación de Promociones</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>✓ Visualiza todas las promociones activas con sus condiciones</li>
          <li>✓ Aplica promociones al momento de crear pedidos</li>
          <li>✓ El sistema valida automáticamente el cumplimiento de condiciones</li>
          <li>✓ Puedes combinar múltiples promociones según reglas del negocio</li>
        </ul>
      </section>
    </div>
  )
}

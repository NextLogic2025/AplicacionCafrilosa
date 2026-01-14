import { RotateCcw } from 'lucide-react'
import { SectionHeader } from 'components/ui/SectionHeader'
import { EmptyContent } from 'components/ui/EmptyContent'
import { PageHero } from 'components/ui/PageHero'

export default function DevolucionesPage() {
  return (
    <div className="space-y-6">
      <PageHero
        title="Devoluciones de Clientes"
        subtitle="Recibe y procesa devoluciones autorizadas desde clientes"
        chips={[
          'Autorización de retorno',
          'Validación de estado',
          'Reinventario de productos',
        ]}
      />

      <SectionHeader
        title="Devoluciones"
        subtitle="Validación y reingreso de mercadería devuelta"
      />

      <EmptyContent
        icon={RotateCcw}
        title="No hay devoluciones pendientes"
        subtitle="Las devoluciones aparecerán aquí cuando se conecte el backend"
      />
    </div>
  )
}

import { RotateCcw } from 'lucide-react'
import { SectionHeader } from 'components/ui/SectionHeader'
import { Alert } from 'components/ui/Alert'
import { EmptyContent } from 'components/ui/EmptyContent'
import { PageHero } from 'components/ui/PageHero'

export default function DevolucionesPage() {
  return (
    <div className="space-y-6">
      <PageHero
        title="Devoluciones"
        subtitle="Retira productos devueltos autorizados y confirma entrega en bodega"
        chips={[
          'Devoluciones autorizadas',
          'Retiro de productos',
          'Confirmación en bodega',
        ]}
      />

      <SectionHeader 
        title="Devoluciones" 
        subtitle="Devoluciones autorizadas para retiro" 
      />

      <Alert
        type="info"
        title="Solo devoluciones autorizadas"
        message="Puedes retirar productos devueltos y confirmar su entrega en bodega (sin datos quemados)."
      />

      <EmptyContent
        icon={RotateCcw}
        title="No hay devoluciones asignadas"
        subtitle="Cuando tengas devoluciones autorizadas, se mostrarán aquí."
      />
    </div>
  )
}

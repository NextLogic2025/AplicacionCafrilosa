import { Package } from 'lucide-react'
import { SectionHeader } from 'components/ui/SectionHeader'
import { Alert } from 'components/ui/Alert'
import { EmptyContent } from 'components/ui/EmptyContent'
import { PageHero } from 'components/ui/PageHero'

export default function PedidosAsignadosPage() {
  return (
    <div className="space-y-6">
      <PageHero
        title="Pedidos Asignados"
        subtitle="Pedidos listos para retiro y entrega en tu zona de cobertura"
        chips={[
          'Retiro en bodega',
          'Preparación de ruta',
          'Confirmación de entrega',
        ]}
      />

      <SectionHeader 
        title="Pedidos Asignados" 
        subtitle="Pedidos listos para retiro y entrega" 
      />

      <Alert
        type="info"
        title="Sin datos aún"
        message="Vista preparada para mostrar pedidos asignados (sin datos quemados)."
      />

      <EmptyContent
        icon={Package}
        title="No hay pedidos asignados"
        subtitle="Cuando tengas pedidos listos para retiro, se mostrarán aquí."
      />
    </div>
  )
}

import { PackagePlus } from 'lucide-react'
import { SectionHeader } from 'components/ui/SectionHeader'
import { EmptyContent } from 'components/ui/EmptyContent'
import { PageHero } from 'components/ui/PageHero'

export default function RecepcionesPage() {
  return (
    <div className="space-y-6">
      <PageHero
        title="Recepciones de Mercadería"
        subtitle="Valida y registra la entrada de nuevos productos a bodega"
        chips={[
          'Validación de documentos',
          'Control de calidad',
          'Ingreso a inventario',
        ]}
      />

      <SectionHeader
        title="Recepciones de Mercadería"
        subtitle="Registro de ingresos al almacén"
      />

      <EmptyContent
        icon={PackagePlus}
        title="No hay recepciones registradas"
        subtitle="Las recepciones aparecerán aquí cuando se conecte el backend"
      />
    </div>
  )
}
 

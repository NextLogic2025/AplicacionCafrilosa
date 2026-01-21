
import { SectionHeader } from 'components/ui/SectionHeader'
import { PageHero } from 'components/ui/PageHero'

export function PendingOrdersHeader() {
    return (
        <>
            <PageHero
                title="Pedidos en Bodega"
                subtitle="Consulta y prepara los pedidos aprobados para despacho"
                chips={[
                    'Estado de preparación',
                    'Picking y packing',
                    'Control de calidad',
                ]}
            />
            <SectionHeader
                title="Pedidos a Preparar"
                subtitle="Pedidos aprobados listos para preparación"
            />
        </>
    )
}

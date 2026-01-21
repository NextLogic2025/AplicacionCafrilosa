
import { Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { SectionHeader } from 'components/ui/SectionHeader'
import { COLORES_MARCA } from '../../../types'

export function OrdersHeader() {
    const navigate = useNavigate()

    return (
        <SectionHeader
            title="Mis Pedidos"
            subtitle="Gestiona y consulta tus pedidos"
            rightSlot={
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => navigate('/cliente/productos')}
                        className="inline-flex items-center gap-2 rounded-lg px-4 py-2 font-semibold text-white transition-colors"
                        style={{ backgroundColor: COLORES_MARCA.red }}
                    >
                        <Plus className="h-5 w-5" />
                        Nuevo Pedido
                    </button>
                    <button
                        onClick={() => navigate('/cliente/carrito')}
                        className="inline-flex items-center gap-2 rounded-lg border border-neutral-300 px-4 py-2 font-semibold text-neutral-800 transition-colors hover:bg-neutral-50"
                    >
                        Ver carrito
                    </button>
                </div>
            }
        />
    )
}

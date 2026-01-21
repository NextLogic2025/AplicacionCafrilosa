
import { Search } from 'lucide-react'
import { EstadoFiltro } from '../hooks/usePedidosPendientes'

interface PedidoFiltersProps {
    searchTerm: string
    setSearchTerm: (term: string) => void
    filtroEstado: EstadoFiltro
    setFiltroEstado: (estado: EstadoFiltro) => void
}

export function PedidoFilters({
    searchTerm,
    setSearchTerm,
    filtroEstado,
    setFiltroEstado
}: PedidoFiltersProps) {
    return (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                <input
                    type="text"
                    placeholder="Buscar por ID, código o cliente..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full rounded-lg border border-neutral-300 bg-white py-2 pl-10 pr-4 text-sm outline-none transition focus:border-brand-red/60 focus:shadow-[0_0_0_4px_rgba(240,65,45,0.18)]"
                />
            </div>

            <div className="flex gap-2">
                {(['TODOS', 'APROBADO', 'EN_PREPARACION', 'FACTURADO'] as EstadoFiltro[]).map((estado) => (
                    <button
                        key={estado}
                        onClick={() => setFiltroEstado(estado)}
                        className={`rounded-lg px-4 py-2 text-sm font-medium transition ${filtroEstado === estado
                            ? 'bg-brand-red text-white'
                            : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                            }`}
                    >
                        {estado === 'TODOS' ? 'Todos' : estado.replace('_', ' ')}
                    </button>
                ))}
            </div>
        </div>
    )
}

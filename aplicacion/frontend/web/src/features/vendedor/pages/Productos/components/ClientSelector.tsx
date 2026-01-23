
import { Store } from 'lucide-react'
import type { Cliente } from '../../../../supervisor/services/clientesApi'

interface ClientSelectorProps {
    clientes: Cliente[]
    clienteSeleccionado: string
    setClienteSeleccionado: (id: string) => void
    loadingClientes: boolean
}

export function ClientSelector({ clientes, clienteSeleccionado, setClienteSeleccionado, loadingClientes }: ClientSelectorProps) {
    return (
        <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-gray-700">Seleccionar Cliente para ver precios específicos</label>
            <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                    <Store size={18} />
                </div>
                <select
                    value={clienteSeleccionado}
                    onChange={(e) => setClienteSeleccionado(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-red-500 focus:ring-red-500 sm:max-w-md"
                    disabled={loadingClientes}
                >
                    <option value="">-- Catálogo General --</option>
                    {clientes.map(cliente => (
                        <option key={cliente.id} value={cliente.id}>
                            {cliente.razon_social || cliente.nombre_comercial} ({cliente.identificacion || 'Sin ID'})
                        </option>
                    ))}
                </select>
                {loadingClientes && <div className="absolute right-3 top-2.5 text-xs text-gray-400">Cargando...</div>}
            </div>
        </div>
    )
}

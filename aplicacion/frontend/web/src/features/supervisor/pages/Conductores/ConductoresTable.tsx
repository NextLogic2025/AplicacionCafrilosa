import { Conductor } from '../../services/conductoresApi'
import { GenericDataTable } from 'components/ui/GenericDataTable'
import { StatusBadge } from 'components/ui/StatusBadge'

interface ConductoresTableProps {
    conductores: Conductor[]
    isLoading: boolean
    onView: (conductor: Conductor) => void
}

export function ConductoresTable({ conductores, isLoading, onView }: ConductoresTableProps) {
    return (
        <GenericDataTable
            data={conductores}
            loading={isLoading}
            searchPlaceholder="Buscar conductor por nombre o cédula..."
            columns={[
                {
                    key: 'nombre_completo',
                    label: 'Conductor',
                    render: (_, item: Conductor) => (
                        <div>
                            <p className="font-semibold text-neutral-900">{item.nombre_completo}</p>
                            <p className="text-xs text-neutral-500">C.I: {item.cedula}</p>
                        </div>
                    ),
                },
                {
                    key: 'telefono',
                    label: 'Contacto',
                    render: (_, item: Conductor) => item.telefono || <span className="text-neutral-400 italic">Sin teléfono</span>,
                },
                {
                    key: 'licencia',
                    label: 'Licencia',
                    render: (_, item: Conductor) => (
                        <span className="font-medium text-neutral-700">
                            {item.licencia || 'N/A'}
                        </span>
                    ),
                },
                {
                    key: 'activo',
                    label: 'Estado',
                    render: (_, item: Conductor) => (
                        <StatusBadge variant={item.activo ? 'success' : 'neutral'}>
                            {item.activo ? 'Activo' : 'Inactivo'}
                        </StatusBadge>
                    )
                },
            ]}
            actions={(item) => [
                {
                    label: 'Ver detalles',
                    onClick: () => onView(item),
                },
            ]}
        />
    )
}

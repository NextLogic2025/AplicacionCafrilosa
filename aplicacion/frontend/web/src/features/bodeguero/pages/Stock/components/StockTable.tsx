
import { GenericDataTable } from 'components/ui/GenericDataTable'
import { StockItem } from '../../../services/stockApi'

interface StockTableProps {
    stock: StockItem[]
    loading: boolean
    role: string | null
    onEdit: (item: StockItem) => void
}

export function StockTable({ stock, loading, role, onEdit }: StockTableProps) {
    return (
        <GenericDataTable
            data={stock}
            loading={loading}
            columns={[
                {
                    label: 'Producto',
                    key: 'lote', // Using lote object as key source
                    render: (_, item: StockItem) => item.lote?.producto?.nombre || 'N/A'
                },
                {
                    label: 'SKU',
                    key: 'id', // Fallback key
                    render: (_, item: StockItem) => item.lote?.producto?.codigo_sku || 'N/A'
                },
                {
                    label: 'Lote',
                    key: 'loteId',
                    render: (_, item: StockItem) => item.lote?.numeroLote || 'N/A'
                },
                {
                    label: 'Ubicación',
                    key: 'ubicacion',
                    render: (_, item: StockItem) => item.ubicacion?.codigoVisual || 'N/A'
                },
                {
                    label: 'Físico',
                    key: 'cantidadFisica',
                },
                {
                    label: 'Disponible',
                    key: 'cantidadDisponible',
                },
            ]}
            onEdit={role !== 'vendedor' ? onEdit : undefined}
        />
    )
}

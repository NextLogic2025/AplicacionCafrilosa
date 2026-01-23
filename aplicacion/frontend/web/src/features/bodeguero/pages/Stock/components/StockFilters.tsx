
import { Product } from '../../../../supervisor/services/productosApi'

interface StockFiltersProps {
    products: Product[]
    selectedProduct: string
    onProductChange: (id: string) => void
}

export function StockFilters({ products, selectedProduct, onProductChange }: StockFiltersProps) {
    return (
        <div className="w-64">
            <select
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-red focus:outline-none focus:ring-1 focus:ring-brand-red"
                value={selectedProduct}
                onChange={(e) => onProductChange(e.target.value)}
            >
                <option value="">Todos los productos</option>
                {products.map(p => (
                    <option key={p.id} value={p.id}>{p.nombre}</option>
                ))}
            </select>
        </div>
    )
}

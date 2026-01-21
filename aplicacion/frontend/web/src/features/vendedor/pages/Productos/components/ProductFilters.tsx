
import { Search, Filter } from 'lucide-react'
import type { FiltrosState, Category } from '../types'

interface ProductFiltersProps {
    busqueda: string
    setBusqueda: (value: string) => void
    mostrarFiltros: boolean
    setMostrarFiltros: (value: boolean) => void
    filtros: FiltrosState
    setFiltros: (value: FiltrosState) => void
    categories: Category[]
    categoryId: string
    setCategoryId: (value: string) => void
}

export function ProductFilters({
    busqueda,
    setBusqueda,
    mostrarFiltros,
    setMostrarFiltros,
    filtros,
    setFiltros,
    categories,
    categoryId,
    setCategoryId
}: ProductFiltersProps) {
    return (
        <section className="rounded-xl border border-neutral-200 bg-white p-6">
            <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Nombre o código..."
                        value={busqueda}
                        onChange={e => setBusqueda(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-transparent focus:ring-2 focus:ring-red-500"
                    />
                </div>
                <button
                    onClick={() => setMostrarFiltros(!mostrarFiltros)}
                    className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 transition hover:bg-gray-50"
                >
                    <Filter size={20} />
                    <span>Filtros</span>
                </button>
            </div>

            {mostrarFiltros && (
                <div className="space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4 mt-4">
                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">Categoría</label>
                        <select
                            value={categoryId || 'all'}
                            onChange={e => {
                                const val = e.target.value
                                if (val === 'all') {
                                    setCategoryId('')
                                    setFiltros({ ...filtros, category: 'all' })
                                    return
                                }
                                setCategoryId(val)
                                const idNum = Number(val)
                                const found = categories.find(c => c.id === idNum)
                                setFiltros({ ...filtros, category: found ? found.nombre : 'all' })
                            }}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-red-500"
                        >
                            <option value="all">Todas las categorías</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={String(cat.id)}>{cat.nombre}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">Precio: ${filtros.minPrice} - ${filtros.maxPrice}</label>
                        <input
                            type="range"
                            min="0"
                            max="10000"
                            step="10"
                            value={filtros.maxPrice}
                            onChange={e => setFiltros({ ...filtros, maxPrice: parseInt(e.target.value) })}
                            className="w-full"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="inStock"
                            checked={filtros.inStock}
                            onChange={e => setFiltros({ ...filtros, inStock: e.target.checked })}
                            className="h-4 w-4 rounded border-gray-300"
                        />
                        <label htmlFor="inStock" className="text-sm text-gray-700">
                            Solo productos disponibles
                        </label>
                    </div>

                    <button
                        onClick={() => setMostrarFiltros(false)}
                        className="w-full rounded-lg bg-gray-200 px-4 py-2 text-sm transition hover:bg-gray-300"
                    >
                        Cerrar Filtros
                    </button>
                </div>
            )}
        </section>
    )
}

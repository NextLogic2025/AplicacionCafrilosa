import { useState, useEffect, useMemo } from 'react'
import { Search, Filter } from 'lucide-react'
import { useCart } from '../../cart/CartContext'
import { useCliente } from '../../hooks/useCliente'
import { SkeletonCard } from 'components/ui/LoadingSpinner'
import { Alert } from 'components/ui/Alert'
import { SectionHeader } from 'components/ui/SectionHeader'
import { ProductCard } from 'components/ui/ProductCard'
import ProductDetailModal from '../../components/ProductDetailModal'
import { CartQuickAction } from '../../components/CartQuickAction'
import { PageHero } from 'components/ui/PageHero'
import { Producto } from '../../types'
import { getAllCategories } from '../../../supervisor/services/catalogApi'

interface FiltrosProductos {
    category: string
    minPrice: number
    maxPrice: number
    inStock: boolean
}

export default function PaginaProductos() {
    const { productos, fetchProductos, error } = useCliente()
    const { addItem } = useCart()
    const [cargando, setCargando] = useState(true)
    const [busqueda, setBusqueda] = useState('')
    const [filtros, setFiltros] = useState<FiltrosProductos>({
        category: 'all',
        minPrice: 0,
        maxPrice: 10000,
        inStock: true,
    })
    const [mostrarFiltros, setMostrarFiltros] = useState(false)
    const [categoryId, setCategoryId] = useState('')
    const [categories, setCategories] = useState<{ id: number; nombre: string }[]>([])
    const [selectedProducto, setSelectedProducto] = useState<Producto | null>(null)
    const [isDetailOpen, setIsDetailOpen] = useState(false)

    useEffect(() => {
        const cargar = async () => {
            setCargando(true)
            if (categoryId && /^\d+$/.test(categoryId)) {
                await fetchProductos({ categoryId: Number(categoryId) })
            } else if (filtros.category && filtros.category !== 'all') {
                await fetchProductos({ category: filtros.category })
            } else {
                await fetchProductos()
            }
            setCargando(false)
        }
        cargar()
    }, [fetchProductos, filtros.category, categoryId])

    useEffect(() => {
        let mounted = true
        getAllCategories()
            .then(list => {
                if (!mounted) return
                setCategories(list.map(c => ({ id: c.id, nombre: c.nombre })))
            })
            .catch(() => {
                // ignore remote catalog hiccups
            })
        return () => {
            mounted = false
        }
    }, [])

    const productosFiltrados = useMemo(() => {
        return productos.filter(producto => {
            const coincideBusqueda =
                producto.name.toLowerCase().includes(busqueda.toLowerCase()) ||
                producto.description.toLowerCase().includes(busqueda.toLowerCase())
            const coincideCategoria = filtros.category === 'all' || producto.category === filtros.category
            const coincidePrecio = producto.price >= filtros.minPrice && producto.price <= filtros.maxPrice
            const coincideStock = !filtros.inStock || producto.inStock
            return coincideBusqueda && coincideCategoria && coincidePrecio && coincideStock
        })
    }, [busqueda, filtros.category, filtros.inStock, filtros.maxPrice, filtros.minPrice, productos])

    const openDetail = (producto: Producto) => {
        setSelectedProducto(producto)
        setIsDetailOpen(true)
    }

    const closeDetail = () => {
        setIsDetailOpen(false)
        setSelectedProducto(null)
    }

    return (
        <div className="space-y-6">
            <PageHero
                title="Catálogo de Productos"
                subtitle="Explora nuestras opciones, filtra por categoría y agrega productos a tu carrito"
                chips={['Productos disponibles', 'Filtros por categoría', 'Información nutricional']}
            />
            {error && <Alert type="error" title="Error" message={error} />}

            <SectionHeader title="Nuestros Productos" subtitle="Explora nuestro catálogo de embutidos premium" />

            <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar productos..."
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
                <div className="space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
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
                                <option key={cat.id} value={String(cat.id)}>
                                    {cat.nombre}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                            Precio: ${filtros.minPrice} - ${filtros.maxPrice}
                        </label>
                        <input
                            type="range"
                            min="0"
                            max="500"
                            step="10"
                            value={filtros.maxPrice}
                            onChange={e => setFiltros({ ...filtros, maxPrice: parseInt(e.target.value, 10) })}
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

            <div className="text-sm text-gray-600">
                Mostrando <span className="font-semibold">{productosFiltrados.length}</span> productos
            </div>

            {cargando ? (
                <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <SkeletonCard key={i} />
                    ))}
                </div>
            ) : productosFiltrados.length > 0 ? (
                <>
                    <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {productosFiltrados.map(producto => (
                            <ProductCard key={producto.id} producto={producto} onAddToCart={addItem} onView={openDetail} />
                        ))}
                    </div>
                    <ProductDetailModal
                        isOpen={isDetailOpen}
                        producto={selectedProducto}
                        onClose={closeDetail}
                        onAddToCart={addItem}
                    />
                </>
            ) : (
                <div className="py-12 text-center">
                    <p className="text-lg text-gray-600">No se encontraron productos</p>
                    <button
                        onClick={() => {
                            setBusqueda('')
                            setFiltros({ category: 'all', minPrice: 0, maxPrice: 10000, inStock: true })
                        }}
                        className="mt-4 font-medium text-brand-red transition hover:opacity-80"
                    >
                        Limpiar filtros
                    </button>
                </div>
            )}

            <CartQuickAction />
        </div>
    )
}

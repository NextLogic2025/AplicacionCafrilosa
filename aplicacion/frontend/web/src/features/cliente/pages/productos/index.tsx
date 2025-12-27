import { useState, useEffect, useMemo } from 'react'
import { Search, Filter, ShoppingCart, Star } from 'lucide-react'
import { useCart } from '../../cart/CartContext'
import { useCliente } from '../../hooks/useCliente'
import { LoadingSpinner, SkeletonCard } from '../../components/LoadingSpinner'
import { Alert } from '../../components/Alert'
import { Producto } from '../../types'

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
	const [filtros, setFiltros] = useState<FiltrosProductos>({ category: 'all', minPrice: 0, maxPrice: 10000, inStock: true })
	const [mostrarFiltros, setMostrarFiltros] = useState(false)

	useEffect(() => {
		const cargar = async () => {
			setCargando(true)
			await fetchProductos()
			setCargando(false)
		}
		cargar()
	}, [fetchProductos, filtros.category])

	const productosFiltrados = useMemo(
		() =>
			productos.filter(producto => {
				const coincideBusqueda =
					producto.name.toLowerCase().includes(busqueda.toLowerCase()) ||
					producto.description.toLowerCase().includes(busqueda.toLowerCase())
				const coincideCategoria = filtros.category === 'all' || producto.category === filtros.category
				const coincidePrecio = producto.price >= filtros.minPrice && producto.price <= filtros.maxPrice
				const coincideStock = !filtros.inStock || producto.inStock
				return coincideBusqueda && coincideCategoria && coincidePrecio && coincideStock
			}),
		[busqueda, filtros.category, filtros.inStock, filtros.maxPrice, filtros.minPrice, productos],
	)

	return (
		<div className="space-y-6">
			{error && <Alert type="error" title="Error" message={error} />}

			<div>
				<h1 className="text-3xl font-bold text-gray-900">Nuestros Productos</h1>
				<p className="mt-2 text-gray-600">Explora nuestro catálogo de embutidos premium</p>
			</div>

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
							value={filtros.category}
							onChange={e => setFiltros({ ...filtros, category: e.target.value })}
							className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-red-500"
						>
							<option value="all">Todas las categorías</option>
							<option value="embutidos">Embutidos</option>
							<option value="carnes">Carnes</option>
							<option value="conservas">Conservas</option>
						</select>
					</div>

					<div>
						<label className="mb-2 block text-sm font-medium text-gray-700">Precio: ${filtros.minPrice} - ${filtros.maxPrice}</label>
						<input
							type="range"
							min="0"
							max="500"
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

			<div className="text-sm text-gray-600">
				Mostrando <span className="font-semibold">{productosFiltrados.length}</span> productos
			</div>

			{cargando ? (
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
					{Array.from({ length: 8 }).map((_, i) => (
						<SkeletonCard key={i} />
					))}
				</div>
			) : productosFiltrados.length > 0 ? (
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
					{productosFiltrados.map(producto => (
						<ProductoCard key={producto.id} producto={producto} />
					))}
				</div>
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
		</div>
	)
}

function ProductoCard({ producto }: { producto: Producto }) {
	const { addItem } = useCart()
	return (
		<div className="overflow-hidden rounded-lg border border-gray-100 bg-white shadow transition hover:shadow-lg">
			<div className="flex h-48 w-full items-center justify-center overflow-hidden bg-gray-200">
				{producto.image && <img src={producto.image} alt={producto.name} className="h-full w-full object-cover transition hover:scale-105" />}
			</div>

			<div className="space-y-3 p-4">
				<h3 className="line-clamp-2 font-semibold text-gray-900">{producto.name}</h3>

				<div className="flex items-center gap-2">
					<div className="flex items-center gap-1">
						{Array.from({ length: 5 }).map((_, i) => (
							<Star
								key={i}
								size={14}
								className={i < Math.floor(producto.rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
							/>
						))}
					</div>
					<span className="text-sm text-gray-600">({producto.reviews || 0})</span>
				</div>

				<p className="text-sm text-gray-600 line-clamp-2">{producto.description}</p>

				<div className="flex items-center justify-between border-t border-gray-100 pt-2">
					<div>
						<p className="text-xl font-bold text-brand-red">${producto.price.toFixed(2)}</p>
						<p className={`text-xs ${producto.inStock ? 'text-emerald-600' : 'text-brand-red'}`}>
							{producto.inStock ? 'En stock' : 'Agotado'}
						</p>
					</div>
					<button
						disabled={!producto.inStock}
						onClick={() => addItem({ id: producto.id, name: producto.name, unitPrice: producto.price, quantity: 1 })}
						className={`rounded-lg p-2 transition ${
							producto.inStock
								? 'bg-brand-red text-white hover:bg-brand-red700'
								: 'cursor-not-allowed bg-gray-200 text-gray-400'
						}`}
					>
						<ShoppingCart size={18} />
					</button>
				</div>
			</div>
		</div>
	)
}
import React, { useEffect, useState } from 'react'
import { Plus, Eye, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { useCliente } from '../../hooks/useCliente'
import { EstadoPedido, Pedido } from '../../types'
import { SkeletonTable } from 'components/ui/LoadingSpinner'
import { Alert } from 'components/ui/Alert'
import { COLORES_MARCA } from '../../types'
import { SectionHeader } from 'components/ui/SectionHeader'
import { Pagination } from 'components/ui/Pagination'
import { PageHero } from 'components/ui/PageHero'
import { formatEstadoPedido, getEstadoPedidoColor } from 'utils/statusHelpers'

export default function PaginaPedidos() {
	const navigate = useNavigate()
	const {
		pedidos,
		pedidosTotalPaginas,
		cargando,
		error,
		fetchPedidos,
		cancelarPedido,
		limpiarError,
		obtenerPedidoPorId,
	} = useCliente()

	const [successMessage, setSuccessMessage] = useState<string | null>(null)

	const [pedidoSeleccionado, setPedidoSeleccionado] = useState<Pedido | null>(null)
	const [paginaActual, setPaginaActual] = useState(1)

	useEffect(() => {
		fetchPedidos(paginaActual)
	}, [fetchPedidos, paginaActual])

	// Reload list when an order is created elsewhere in the app and show success message
	useEffect(() => {
		const handler = (ev: Event) => {
			const detail = (ev as CustomEvent)?.detail as any
			if (detail && typeof detail.message === 'string') setSuccessMessage(detail.message)
			fetchPedidos(paginaActual)
		}
		window.addEventListener('pedidoCreado', handler as EventListener)
		return () => window.removeEventListener('pedidoCreado', handler as EventListener)
	}, [fetchPedidos, paginaActual])

	// auto-clear success message
	useEffect(() => {
		if (!successMessage) return
		const t = setTimeout(() => setSuccessMessage(null), 4000)
		return () => clearTimeout(t)
	}, [successMessage])

	const cambiarPagina = (pagina: number) => setPaginaActual(pagina)

	return (
		<>
			<PageHero
				title="Mis Pedidos"
				subtitle="Consulta el estado de tus pedidos y accede a los detalles de cada uno"
				chips={[
					'Estado de pedidos',
					'Historial completo',
					'Rastreo en tiempo real',
				]}
			/>

			<div className="mx-auto max-w-6xl space-y-6 p-4 md:p-8">
				{error && <Alert type="error" title="Error" message={error} onClose={limpiarError} />}

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

				{cargando && !pedidos.length ? (
					<SkeletonTable rows={5} />
				) : pedidos.length === 0 ? (
					<div className="py-12 text-center">
						<p className="mb-4 text-gray-600">No tienes pedidos aún</p>
						<button
							onClick={() => navigate('/cliente/productos')}
							className="inline-flex items-center gap-2 rounded-lg px-6 py-2 font-semibold text-white"
							style={{ backgroundColor: COLORES_MARCA.red }}
						>
							<Plus className="h-5 w-5" />
							Crear tu primer pedido
						</button>
					</div>
				) : (
					<>
						{successMessage && (
							<div className="mb-4">
								<Alert type="success" title="Pedido creado" message={successMessage} onClose={() => setSuccessMessage(null)} />
							</div>
						)}
						<div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
							<table className="w-full">
								<thead>
									<tr className="border-b border-gray-200 bg-gray-50">
										<th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Número</th>
										<th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Fecha</th>
										<th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Total</th>
										<th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Estado</th>
										<th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Acciones</th>
									</tr>
								</thead>
								<tbody>
									{pedidos.map(pedido => (
										<tr key={pedido.id} className="border-b border-gray-100 hover:bg-gray-50">
											<td className="px-4 py-3 text-sm font-medium text-gray-900">{pedido.orderNumber}</td>
											<td className="px-4 py-3 text-sm text-gray-600">{new Date(pedido.createdAt).toLocaleDateString('es-ES')}</td>
											<td className="px-4 py-3 text-sm font-semibold text-gray-900">${pedido.totalAmount.toFixed(2)}</td>
											<td className="px-4 py-3">
												<span
													className="inline-block rounded-full px-3 py-1 text-xs font-semibold text-white"
													style={{ backgroundColor: getEstadoPedidoColor(pedido.status) }}
												>
													{formatEstadoPedido(pedido.status)}
												</span>
											</td>
											<td className="px-4 py-3 text-right flex items-center justify-end gap-2">
												<button
													onClick={() => setPedidoSeleccionado(pedido)}
													className="text-blue-600 transition-colors hover:text-blue-700"
													title="Ver detalles"
												>
													<Eye className="h-5 w-5" />
												</button>
												{(pedido.status === EstadoPedido.PENDING || String(pedido.status).toUpperCase() === 'PENDIENTE') && (
													<button
														onClick={() => {
															if (!confirm('¿Estás seguro que deseas cancelar este pedido?')) return
															cancelarPedido(pedido.id)
															setPedidoSeleccionado(null)
														}}
														className="text-red-600 transition-colors hover:text-red-700"
														title="Cancelar pedido"
													>
														<X className="h-5 w-5" />
													</button>
												)}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>

						<Pagination
							currentPage={paginaActual}
							totalPages={pedidosTotalPaginas}
							onPageChange={cambiarPagina}
							color={COLORES_MARCA.red}
						/>
					</>
				)}

				{pedidoSeleccionado && (
					<ModalDetallePedido
						pedido={pedidoSeleccionado}
						onClose={() => setPedidoSeleccionado(null)}
						onCancel={() => {
							cancelarPedido(pedidoSeleccionado.id)
							setPedidoSeleccionado(null)
						}}
						fetchDetallePedido={obtenerPedidoPorId}
					/>
				)}
			</div>
		</>
	)
}

function ModalDetallePedido({
	pedido,
	onClose,
	onCancel,
	fetchDetallePedido,
}: {
	pedido: Pedido
	onClose: () => void
	onCancel: () => void
	fetchDetallePedido: (id: string) => Promise<Pedido>
}) {
	const [detalle, setDetalle] = useState<Pedido>(pedido)
	const [cargandoDetalle, setCargandoDetalle] = useState(false)
	const [detalleError, setDetalleError] = useState<string | null>(null)

	useEffect(() => {
		let isMounted = true
		setDetalle(pedido)
		if (pedido.items.length > 0) {
			setDetalleError(null)
			setCargandoDetalle(false)
			return () => {
				isMounted = false
			}
		}

		setCargandoDetalle(true)
		setDetalleError(null)
		const loadDetalle = async () => {
			try {
				const enriched = await fetchDetallePedido(pedido.id)
				if (!isMounted) return
				setDetalle(enriched)
			} catch (err) {
				if (!isMounted) return
				const message = err instanceof Error ? err.message : 'No se pudo cargar el detalle del pedido'
				setDetalleError(message)
			} finally {
				if (isMounted) setCargandoDetalle(false)
			}
		}
		loadDetalle()
		return () => {
			isMounted = false
		}
	}, [pedido, fetchDetallePedido])

	const puedeCancelar = detalle.status === EstadoPedido.PENDING || String(detalle.status).toUpperCase() === 'PENDIENTE'
	const estadoColor = getEstadoPedidoColor(detalle.status)
	const formattedDate = new Date(detalle.createdAt).toLocaleDateString('es-ES')
	const totalLineas = detalle.items.reduce((acc, item) => acc + item.quantity, 0)

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
			<div className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl">
				<div className="flex items-start justify-between border-b border-neutral-200 px-8 py-6">
					<div>
						<p className="text-sm font-semibold text-neutral-500">Detalles del Pedido</p>
						<h2 className="text-2xl font-bold text-neutral-900">#{detalle.orderNumber}</h2>
					</div>
					<span
						className="rounded-full px-3 py-1 text-xs font-semibold text-white"
						style={{ backgroundColor: estadoColor }}
					>
						{formatEstadoPedido(detalle.status)}
					</span>
					<button onClick={onClose} className="text-neutral-400 transition-colors hover:text-neutral-600">
						<X className="h-6 w-6" />
					</button>
				</div>

				<div className="space-y-8 px-8 py-6 overflow-y-auto">
					<div className="grid gap-4 md:grid-cols-3">
						<div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3">
							<p className="text-xs uppercase tracking-wide text-neutral-500">Fecha</p>
							<p className="text-lg font-semibold text-neutral-900">{formattedDate}</p>
						</div>
						<div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3">
							<p className="text-xs uppercase tracking-wide text-neutral-500">Total líneas</p>
							<p className="text-lg font-semibold text-neutral-900">{totalLineas} unidades</p>
						</div>
						<div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3">
							<p className="text-xs uppercase tracking-wide text-neutral-500">Monto total</p>
							<p className="text-xl font-bold" style={{ color: COLORES_MARCA.red }}>${detalle.totalAmount.toFixed(2)}</p>
						</div>
					</div>

					<div>
						<div className="mb-3 flex items-center gap-2">
							<h3 className="text-lg font-semibold text-neutral-900">Productos</h3>
							<span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-500">{detalle.items.length} líneas</span>
						</div>
						<div className="divide-y divide-neutral-100 rounded-2xl border border-neutral-200">
							{cargandoDetalle ? (
								<div className="px-4 py-6 text-center text-sm text-neutral-500">Cargando productos...</div>
							) : detalleError ? (
								<div className="px-4 py-6 text-center text-sm text-red-600">{detalleError}</div>
							) : detalle.items.length === 0 ? (
								<div className="px-4 py-6 text-center text-sm text-neutral-500">Este pedido no tiene productos registrados.</div>
							) : (
								detalle.items.map(item => (
									<div key={item.id} className="grid gap-4 px-4 py-3 md:grid-cols-3">
										<div className="md:col-span-2">
											<p className="text-sm font-semibold text-neutral-900">{item.productName}</p>
											<p className="text-xs text-neutral-500">
												{item.quantity} {item.unit} × ${item.unitPrice.toFixed(2)}
											</p>
										</div>
										<p className="text-right text-sm font-bold text-neutral-900">${item.subtotal.toFixed(2)}</p>
									</div>
								))
							)}
						</div>
					</div>

				</div>

				<div className="flex flex-col gap-3 border-t border-neutral-200 px-8 py-6 md:flex-row">
					<button
						onClick={onClose}
						className="flex-1 rounded-xl border border-neutral-300 px-4 py-3 text-center text-sm font-semibold text-neutral-900 transition-colors hover:bg-neutral-50"
					>
						Cerrar
					</button>
					{puedeCancelar && (
						<button
							onClick={onCancel}
							className="flex-1 rounded-xl px-4 py-3 text-center text-sm font-semibold text-white transition-colors"
							style={{ backgroundColor: COLORES_MARCA.red }}
						>
							Cancelar Pedido
						</button>
					)}
				</div>
			</div>
		</div>
	)
}
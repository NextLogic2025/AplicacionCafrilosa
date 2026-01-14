import React, { useEffect, useState } from 'react'
import { Plus, Eye, X, ClipboardList } from 'lucide-react'
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
													// eslint-disable-next-line no-console
													console.log('[UI] cancelarPedido invoked for', pedido.id)
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
				/>
			)}
			</div>
		</>
	)
}

function ModalDetallePedido({ pedido, onClose, onCancel }: { pedido: Pedido; onClose: () => void; onCancel: () => void }) {
	const puedeCancelar = pedido.status === EstadoPedido.PENDING || String(pedido.status).toUpperCase() === 'PENDIENTE'
	const endpoint = `http://localhost:3004/orders/${pedido.id}/state`

	const copyEndpoint = async () => {
		try {
			await navigator.clipboard.writeText(endpoint)
			// eslint-disable-next-line no-alert
			alert('Endpoint copiado al portapapeles')
		} catch (e) {
			// eslint-disable-next-line no-alert
			alert('No se pudo copiar. Selecciona y copia manualmente: ' + endpoint)
		}
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
			<div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white">
				<div className="flex items-center justify-between border-b border-gray-200 p-6">
					<h2 className="text-xl font-bold text-gray-900">Detalles del Pedido</h2>
					<button onClick={onClose} className="text-gray-500 transition-colors hover:text-gray-700">
						<X className="h-6 w-6" />
					</button>
				</div>

				<div className="space-y-6 p-6">
					<div className="grid grid-cols-2 gap-4">
						<div>
							<p className="text-xs uppercase text-gray-600">Número de Pedido</p>
							<p className="text-lg font-semibold text-gray-900">{pedido.orderNumber}</p>
						</div>
						<div>
							<p className="text-xs uppercase text-gray-600">Fecha</p>
							<p className="text-lg font-semibold text-gray-900">{new Date(pedido.createdAt).toLocaleDateString('es-ES')}</p>
						</div>
					</div>

					<div>
						<h3 className="mb-4 font-semibold text-gray-900">Productos</h3>
						<div className="space-y-2">
							{pedido.items.map(item => (
								<div key={item.id} className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
									<div>
										<p className="font-medium text-gray-900">{item.productName}</p>
										<p className="text-sm text-gray-600">
											{item.quantity} {item.unit} x ${item.unitPrice.toFixed(2)}
										</p>
									</div>
									<p className="font-semibold text-gray-900">${item.subtotal.toFixed(2)}</p>
								</div>
							))}
						</div>
					</div>

					<div className="border-t border-gray-200 pt-4">
						<div className="flex items-center justify-between">
							<p className="text-lg font-semibold text-gray-900">Total</p>
							<p className="text-2xl font-bold" style={{ color: COLORES_MARCA.red }}>
								${pedido.totalAmount.toFixed(2)}
							</p>
						</div>
					</div>

					{/* API info for debugging/copy */}
					<div className="mt-4 rounded-lg border border-gray-100 bg-gray-50 p-3">
						<p className="text-xs text-gray-600">Endpoint para cancelar (cliente):</p>
						<div className="mt-2 flex items-center justify-between gap-2">
							<code className="truncate text-sm text-gray-800">PATCH {endpoint}</code>
							<button
								onClick={copyEndpoint}
								className="inline-flex items-center gap-2 rounded-md bg-white px-3 py-1 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-100"
								title="Copiar endpoint"
							>
								<ClipboardList className="h-4 w-4" />
								Copiar
							</button>
						</div>
						<pre className="mt-3 w-full overflow-auto rounded bg-white p-2 text-xs">{"{\"nuevoEstado\":\"CANCELADO\",\"comentario\":\"Motivo opcional\"}"}</pre>
					</div>
				</div>

				<div className="flex gap-3 border-t border-gray-200 p-6">
					<button
						onClick={onClose}
						className="flex-1 rounded-lg border border-gray-300 px-4 py-2 font-semibold text-gray-900 transition-colors hover:bg-gray-50"
					>
						Cerrar
					</button>
					{puedeCancelar && (
						<button
							onClick={onCancel}
							className="flex-1 rounded-lg bg-brand-red px-4 py-2 font-semibold text-white transition-colors hover:bg-brand-red700"
						>
							Cancelar Pedido
						</button>
					)}
				</div>
			</div>
		</div>
	)
}
import { useState, useEffect, useMemo } from 'react'
import { Download, Eye, FileText } from 'lucide-react'
import { useCliente } from '../../hooks/useCliente'
import { LoadingSpinner, SkeletonTable } from 'components/ui/LoadingSpinner'
import { Alert } from 'components/ui/Alert'
import { SectionHeader } from 'components/ui/SectionHeader'
import { FilterGroup } from 'components/ui/FilterButton'
import { PageHero } from 'components/ui/PageHero'
import { facturaStatusConfig } from 'utils/statusHelpers'
import { EstadoFactura, Factura } from '../../types'

interface FiltrosFactura {
	status: EstadoFactura | 'all'
	dateRange: 'all' | 'month' | 'quarter' | 'year'
}

export default function PaginaFacturas() {
	const { facturas, fetchFacturas, error } = useCliente()
	const [cargando, setCargando] = useState(true)
	const [facturaSeleccionada, setFacturaSeleccionada] = useState<Factura | null>(null)
	const [filtros, setFiltros] = useState<FiltrosFactura>({ status: 'all', dateRange: 'all' })

	useEffect(() => {
		const cargar = async () => {
			setCargando(true)
			await fetchFacturas()
			setCargando(false)
		}
		cargar()
	}, [fetchFacturas])

	const facturasFiltradas = useMemo(
		() =>
			facturas.filter(inv => {
				const coincideEstado = filtros.status === 'all' || inv.status === filtros.status
				return coincideEstado
			}),
		[facturas, filtros.status],
	)

	const totalPendiente = facturasFiltradas
		.filter(inv => inv.status === EstadoFactura.PENDING)
		.reduce((sum, inv) => sum + inv.total, 0)

	const totalVencido = facturasFiltradas
		.filter(inv => inv.status === EstadoFactura.OVERDUE)
		.reduce((sum, inv) => sum + inv.total, 0)

	const totalPagado = facturasFiltradas
		.filter(inv => inv.status === EstadoFactura.PAID)
		.reduce((sum, inv) => sum + inv.total, 0)

	const descargarPdf = (invoiceId: string) => {
		console.log('Descargando factura:', invoiceId)
		alert('Descarga iniciada (mock)')
	}

	return (
		<div className="space-y-6">
			<PageHero
				title="Mis Facturas"
				subtitle="Descarga, consulta y gestiona todas tus facturas emitidas"
				chips={[
					'Facturas electrónicas',
					'Estado de pago',
					'Descargar PDF',
				]}
			/>

			{error && <Alert type="error" title="Error" message={error} />}

			<SectionHeader title="Facturas y Pagos" subtitle="Gestiona tus facturas e historial de pagos" />

			<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
				<div className="rounded-lg border border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 p-4">
					<p className="text-sm font-medium text-blue-700">Pendiente de Pago</p>
					<p className="mt-2 text-2xl font-bold text-blue-900">${totalPendiente.toFixed(2)}</p>
				</div>
				<div className="rounded-lg border border-red-200 bg-gradient-to-br from-red-50 to-red-100 p-4">
					<p className="text-sm font-medium text-brand-red">Vencidas</p>
					<p className="mt-2 text-2xl font-bold text-brand-red">${totalVencido.toFixed(2)}</p>
				</div>
				<div className="rounded-lg border border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100 p-4">
					<p className="text-sm font-medium text-emerald-700">Pagadas</p>
					<p className="mt-2 text-2xl font-bold text-emerald-900">${totalPagado.toFixed(2)}</p>
				</div>
			</div>

<FilterGroup
			filters={[
				{ value: 'all', label: 'Todas' },
				{ value: 'PAID', label: facturaStatusConfig[EstadoFactura.PAID].label },
				{ value: 'PENDING', label: facturaStatusConfig[EstadoFactura.PENDING].label },
				{ value: 'OVERDUE', label: facturaStatusConfig[EstadoFactura.OVERDUE].label },
			]}
			activeFilter={filtros.status}
			onChange={(value) => setFiltros({ ...filtros, status: value as any })}
		/>

			{cargando ? (
				<SkeletonTable />
			) : (
				<div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
					<div className="overflow-x-auto">
						<table className="w-full">
							<thead className="border-b border-gray-200 bg-gray-50">
								<tr>
									<th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Factura</th>
									<th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Fecha</th>
									<th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Vencimiento</th>
									<th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Total</th>
									<th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Estado</th>
									<th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Acciones</th>
								</tr>
							</thead>
							<tbody>
								{facturasFiltradas.length > 0 ? (
									facturasFiltradas.map(invoice => (
										<tr key={invoice.id} className="border-b border-gray-100 transition hover:bg-gray-50">
											<td className="px-4 py-3 text-sm font-medium text-gray-900">{invoice.invoiceNumber}</td>
											<td className="px-4 py-3 text-sm text-gray-600">
												{new Date(invoice.date).toLocaleDateString('es-ES')}
											</td>
											<td className="px-4 py-3 text-sm text-gray-600">
												{new Date(invoice.dueDate).toLocaleDateString('es-ES')}
											</td>
											<td className="px-4 py-3 text-sm font-semibold text-gray-900">${invoice.total.toFixed(2)}</td>
											<td className="px-4 py-3 text-sm">
												<span className={`rounded px-2 py-1 text-xs font-medium ${facturaStatusConfig[invoice.status].color}`}>
													{facturaStatusConfig[invoice.status].label}
												</span>
											</td>
											<td className="px-4 py-3 text-right text-sm space-x-2">
												<button
													onClick={() => setFacturaSeleccionada(invoice)}
													className="inline-flex items-center gap-1 text-blue-600 transition hover:text-blue-800"
												>
													<Eye size={16} />
													Ver
												</button>
												<button
													onClick={() => descargarPdf(invoice.id)}
													className="inline-flex items-center gap-1 text-emerald-600 transition hover:text-emerald-800"
												>
													<Download size={16} />
													PDF
												</button>
											</td>
										</tr>
									))
								) : (
									<tr>
										<td colSpan={6} className="px-4 py-8 text-center text-gray-600">
											No se encontraron facturas
										</td>
									</tr>
								)}
							</tbody>
						</table>
					</div>
				</div>
			)}

			{facturaSeleccionada && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
					<div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white">
						<div className="sticky top-0 flex items-center justify-between bg-gradient-to-r from-brand-red to-brand-red700 p-6 text-white">
							<h2 className="text-2xl font-bold">{facturaSeleccionada.invoiceNumber}</h2>
							<button onClick={() => setFacturaSeleccionada(null)} className="text-2xl text-white hover:text-red-100">
								×
							</button>
						</div>

						<div className="space-y-6 p-6">
							<div className="grid grid-cols-2 gap-4">
								<div>
									<p className="text-sm text-gray-600">Fecha</p>
									<p className="font-semibold">
										{new Date(facturaSeleccionada.date).toLocaleDateString('es-ES')}
									</p>
								</div>
								<div>
									<p className="text-sm text-gray-600">Vencimiento</p>
									<p className="font-semibold">
										{new Date(facturaSeleccionada.dueDate).toLocaleDateString('es-ES')}
									</p>
								</div>
								<div>
									<p className="text-sm text-gray-600">Estado</p>
								<p className={`font-semibold ${facturaStatusConfig[facturaSeleccionada.status].color}`}>
									{facturaStatusConfig[facturaSeleccionada.status].label}
									</p>
								</div>
								<div>
									<p className="text-sm text-gray-600">Total</p>
									<p className="text-2xl font-bold text-brand-red">${facturaSeleccionada.total.toFixed(2)}</p>
								</div>
							</div>

							<div>
								<h3 className="mb-3 font-semibold">Detalles de Compra</h3>
								<div className="overflow-hidden rounded-lg border border-gray-200">
									<table className="w-full text-sm">
										<thead className="bg-gray-50">
											<tr>
												<th className="px-3 py-2 text-left">Producto</th>
												<th className="px-3 py-2 text-right">Cantidad</th>
												<th className="px-3 py-2 text-right">Precio</th>
												<th className="px-3 py-2 text-right">Subtotal</th>
											</tr>
										</thead>
										<tbody>
											{facturaSeleccionada.items.map(item => (
												<tr key={item.id} className="border-t border-gray-100">
													<td className="px-3 py-2">Producto {item.productId}</td>
													<td className="px-3 py-2 text-right">{item.quantity}</td>
													<td className="px-3 py-2 text-right">${item.unitPrice.toFixed(2)}</td>
													<td className="px-3 py-2 text-right font-semibold">
														${(item.quantity * item.unitPrice).toFixed(2)}
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							</div>

							<div className="flex justify-end gap-2 border-t border-gray-200 pt-4">
								<button
									onClick={() => setFacturaSeleccionada(null)}
									className="rounded-lg border border-gray-300 px-4 py-2 font-semibold text-gray-900 transition hover:bg-gray-50"
								>
									Cerrar
								</button>
								<button
									onClick={() => descargarPdf(facturaSeleccionada.id)}
									className="flex items-center gap-2 rounded-lg bg-brand-red px-4 py-2 font-semibold text-white transition hover:bg-brand-red700"
								>
									<Download size={18} />
									Descargar PDF
								</button>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}
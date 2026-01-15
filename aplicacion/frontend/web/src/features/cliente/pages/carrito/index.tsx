import React from 'react'
import { Trash2, Minus, Plus, CheckCircle2, Info, Building2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { useCart } from '../../cart/CartContext'
import { useCliente } from '../../hooks/useCliente'
import { Alert } from 'components/ui/Alert'
import { SectionHeader } from 'components/ui/SectionHeader'
import { PageHero } from 'components/ui/PageHero'

export default function PaginaCarrito() {
	const navigate = useNavigate()
	const { items, total, updateQuantity, removeItem, clearCart, warnings, removedItems } = useCart()
	const { crearPedidoDesdeCarrito, perfil, fetchPerfilCliente, sucursales, fetchSucursales } = useCliente()
	const [selectedSucursalId, setSelectedSucursalId] = React.useState<string | null>(null)
	const [destinoTipo, setDestinoTipo] = React.useState<'cliente' | 'sucursal'>('cliente')
	const [invalidSucursalMessage, setInvalidSucursalMessage] = React.useState<string | null>(null)

	const isUuid = React.useCallback((value: string | null | undefined) => {
		if (!value) return false
		return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
	}, [])

	const selectedSucursal = React.useMemo(() => sucursales.find(s => s.id === selectedSucursalId) ?? null, [sucursales, selectedSucursalId])

	// Ensure perfil is loaded when opening the carrito page directly
	React.useEffect(() => {
		if (!perfil) fetchPerfilCliente()
	}, [perfil, fetchPerfilCliente])

	React.useEffect(() => {
		fetchSucursales()
	}, [fetchSucursales])

	React.useEffect(() => {
		if (destinoTipo !== 'sucursal') {
			setInvalidSucursalMessage(null)
			return
		}
		if (!selectedSucursalId) {
			setInvalidSucursalMessage('Selecciona una sucursal disponible para enviar el pedido.')
			return
		}
		const stillExists = sucursales.some(s => s.id === selectedSucursalId)
		if (!stillExists) {
			setSelectedSucursalId(null)
			setInvalidSucursalMessage('La sucursal seleccionada ya no está disponible, elige otra opción.')
			return
		}
		setInvalidSucursalMessage(isUuid(selectedSucursalId) ? null : 'Esta sucursal no cuenta con un identificador compatible con el servicio de pedidos. Usa la dirección principal o solicita que actualicen el catálogo.')
	}, [selectedSucursalId, sucursales, isUuid, destinoTipo])

	React.useEffect(() => {
		if (destinoTipo === 'sucursal' && !selectedSucursalId && sucursales.length > 0) {
			setSelectedSucursalId(sucursales[0].id)
		}
		if (destinoTipo === 'sucursal' && sucursales.length === 0) {
			setDestinoTipo('cliente')
			setSelectedSucursalId(null)
		}
	}, [destinoTipo, selectedSucursalId, sucursales])

	const creditoDisponible = Math.max((perfil?.creditLimit || 0) - (perfil?.currentDebt || 0), 0)
	const superaCredito = total > creditoDisponible
	const condicionComercial = superaCredito ? 'Contado' : 'Crédito'
	const condicionPagoApi = superaCredito ? 'CONTADO' : 'CREDITO'
	const destinoDescripcion = destinoTipo === 'cliente'
		? 'Cliente principal'
		: selectedSucursal
			? `${selectedSucursal.nombre}${selectedSucursal.ciudad ? ` · ${selectedSucursal.ciudad}` : ''}`
			: 'Selecciona una sucursal'

	const handleDestinoTipoChange = (tipo: 'cliente' | 'sucursal') => {
		if (tipo === 'sucursal' && sucursales.length === 0) return
		setDestinoTipo(tipo)
		if (tipo === 'cliente') {
			setSelectedSucursalId(null)
		} else if (!selectedSucursalId && sucursales.length > 0) {
			setSelectedSucursalId(sucursales[0].id)
		}
	}

	const confirmarPedido = async () => {
		if (items.length === 0) return
		if (superaCredito) return
		const wantsSucursal = destinoTipo === 'sucursal'
		const sucursalIdForApi = wantsSucursal && selectedSucursalId && isUuid(selectedSucursalId) ? selectedSucursalId : undefined
		if (wantsSucursal && !selectedSucursalId) {
			setInvalidSucursalMessage('Selecciona una sucursal para poder enviar el pedido a esa ubicación.')
			return
		}
		if (wantsSucursal && selectedSucursalId && !sucursalIdForApi) {
			setInvalidSucursalMessage('La sucursal seleccionada no tiene un identificador válido. El pedido se enviará al cliente principal hasta que el catálogo tenga IDs válidos.')
			return
		}
		try {
			await crearPedidoDesdeCarrito({
				sucursalId: sucursalIdForApi,
				condicionPago: condicionPagoApi,
			})
			clearCart()
			// notify orders list to refresh and provide a success message
			try { window.dispatchEvent(new CustomEvent('pedidoCreado', { detail: { message: 'Pedido creado correctamente' } })) } catch { }
			navigate('/cliente/pedidos', { replace: true })
		} catch (e) {
			// eslint-disable-next-line no-alert
			alert('No se pudo crear el pedido: ' + (e instanceof Error ? e.message : 'error'))
		}
	}

	return (
		<div className="space-y-6">
			<PageHero
				title="Mi Carrito"
				subtitle="Revisa tu carrito, ajusta cantidades y procede al checkout"
				chips={[
					'Productos seleccionados',
					'Totales y descuentos',
					'Proceder a compra',
				]}
			/>

			<div className="space-y-4">
				<SectionHeader
					title="Carrito de compras"
					rightSlot={
						items.length > 0 ? (
							<button
								type="button"
								onClick={clearCart}
								className="text-sm font-semibold text-brand-red underline-offset-2 hover:underline"
							>
								Vaciar carrito
							</button>
						) : null
					}
				/>

				{items.length === 0 ? (
					<div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-6 text-center text-sm text-neutral-600">
						Tu carrito está vacío.
					</div>
				) : (
					<div className="grid gap-4 lg:grid-cols-3 items-start">
						{warnings && warnings.length > 0 ? (
							<div className="lg:col-span-3">
								<Alert type="info" title="Advertencia" message={warnings.map(w => w.issue).join(', ')} />
							</div>
						) : null}
						{removedItems && removedItems.length > 0 ? (
							<div className="lg:col-span-3">
								<Alert type="error" title="Items eliminados" message={`Algunas líneas fueron eliminadas del carrito: ${removedItems.map(r => r.producto_id).join(', ')}`} />
							</div>
						) : null}
						<div className="lg:col-span-2 space-y-3 max-h-[60vh] overflow-auto pr-2">
							{items.map(item => (
								<div key={item.id} className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
									<div className="flex-1">
										<p className="text-sm font-semibold text-neutral-900">{item.name}</p>
										<p className="text-xs text-neutral-500">Precio unitario: ${item.unitPrice.toFixed(2)}</p>
									</div>
									<div className="flex items-center gap-2">
										<button
											type="button"
											aria-label="Disminuir"
											onClick={() => updateQuantity(item.id, Math.max(item.quantity - 1, 0))}
											className="rounded-lg border border-neutral-200 bg-neutral-50 p-1 text-neutral-700 hover:bg-neutral-100"
										>
											<Minus className="h-4 w-4" />
										</button>
										<span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
										<button
											type="button"
											aria-label="Aumentar"
											onClick={() => updateQuantity(item.id, item.quantity + 1)}
											className="rounded-lg border border-neutral-200 bg-neutral-50 p-1 text-neutral-700 hover:bg-neutral-100"
										>
											<Plus className="h-4 w-4" />
										</button>
									</div>
									<div className="w-24 text-right text-sm font-bold text-neutral-900">
										${(item.unitPrice * item.quantity).toFixed(2)}
									</div>
									<button
										type="button"
										aria-label="Eliminar"
										onClick={() => removeItem(item.id)}
										className="rounded-lg bg-red-50 p-2 text-brand-red hover:bg-red-100"
									>
										<Trash2 className="h-4 w-4" />
									</button>
								</div>
							))}

							<div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-xs text-neutral-700">
								<div className="flex items-center gap-2">
									<Info className="h-4 w-4 text-neutral-500" />
									<span>Stock sujeto a disponibilidad. El pedido será validado.</span>
								</div>
							</div>
						</div>

						<div className="space-y-3 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm lg:col-span-1 lg:sticky lg:top-24">
							<div className="flex items-center justify-between">
								<p className="text-sm text-neutral-700">Total</p>
								<p className="text-xl font-bold text-neutral-900">${total.toFixed(2)}</p>
							</div>
							<div className="flex items-center justify-between">
								<p className="text-sm text-neutral-700">Crédito disponible</p>
								<p className={`text-sm font-semibold ${superaCredito ? 'text-brand-red' : 'text-emerald-700'}`}>${creditoDisponible.toFixed(2)}</p>
							</div>
							<div className="flex items-center justify-between">
								<p className="text-sm text-neutral-700">Condición comercial</p>
								<p className="text-sm font-semibold text-neutral-900">{condicionComercial}</p>
							</div>
							{superaCredito ? (
								<div className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800">
									El total excede tu crédito disponible.
								</div>
							) : (
								<div className="rounded-xl bg-green-50 px-3 py-2 text-sm text-green-800">
									<CheckCircle2 className="mr-1 inline h-4 w-4" /> Cumple con crédito disponible.
								</div>
							)}
							{sucursales.length > 0 && (
								<div className="rounded-2xl border border-neutral-200 px-3 py-3">
									<div className="mb-2 flex items-center gap-2 text-sm font-semibold text-neutral-900">
										<Building2 className="h-4 w-4 text-brand-red" /> Destino del pedido
									</div>
									<p className="text-xs text-neutral-500">Si tu empresa tiene sucursales, puedes enviar este pedido directamente a una de ellas.</p>
									<div className="mt-3 space-y-2">
										<label className={`flex cursor-pointer items-start gap-2 rounded-xl border px-3 py-2 text-sm ${destinoTipo === 'cliente' ? 'border-brand-red/50 bg-brand-red/5' : 'border-neutral-200 hover:border-neutral-300'}`}>
											<input
												type="radio"
												name="destinoPedido"
												checked={destinoTipo === 'cliente'}
												onChange={() => handleDestinoTipoChange('cliente')}
												className="mt-1"
											/>
											<div>
												<p className="font-semibold text-neutral-900">Cliente principal</p>
												<p className="text-xs text-neutral-500">Usaremos la dirección registrada del cliente.</p>
											</div>
										</label>
										<label className={`flex cursor-pointer items-start gap-2 rounded-xl border px-3 py-2 text-sm ${destinoTipo === 'sucursal' ? 'border-brand-red/50 bg-brand-red/5' : 'border-neutral-200 hover:border-neutral-300'} ${sucursales.length === 0 ? 'opacity-60' : ''}`}>
											<input
												type="radio"
												name="destinoPedido"
												checked={destinoTipo === 'sucursal'}
												onChange={() => handleDestinoTipoChange('sucursal')}
												disabled={sucursales.length === 0}
												className="mt-1"
											/>
											<div>
												<p className="font-semibold text-neutral-900">Sucursal</p>
												<p className="text-xs text-neutral-500">
													{sucursales.length > 0 ? 'Selecciona una de tus sucursales registradas.' : 'Aún no registras sucursales en tu catálogo.'}
												</p>
											</div>
										</label>
									</div>
									{destinoTipo === 'sucursal' && sucursales.length > 0 && (
										<div className="mt-3 space-y-2 rounded-xl border border-dashed border-brand-red/40 bg-brand-red/5 px-3 py-3">
											<p className="text-xs font-semibold uppercase tracking-wide text-brand-red">Selecciona la sucursal</p>
											<div className="space-y-2">
												{sucursales.map(sucursal => (
													<label
														key={sucursal.id}
														className={`flex cursor-pointer items-start gap-2 rounded-xl border bg-white px-3 py-2 text-sm ${selectedSucursalId === sucursal.id ? 'border-brand-red/60 shadow-sm' : 'border-brand-red/10 hover:border-brand-red/40'}`}
													>
														<input
															type="radio"
															name="destinoSucursal"
															checked={selectedSucursalId === sucursal.id}
															onChange={() => setSelectedSucursalId(sucursal.id)}
															className="mt-1"
														/>
														<div>
															<p className="font-semibold text-neutral-900">{sucursal.nombre}</p>
															<p className="text-xs text-neutral-500">
																{[sucursal.direccion, sucursal.ciudad, sucursal.estado].filter(Boolean).join(' · ') || 'Sin dirección registrada'}
															</p>
														</div>
													</label>
												))}
											</div>
										</div>
									)}
									<div className="mt-3 rounded-xl bg-neutral-50 px-3 py-2 text-xs text-neutral-500">
										Destino actual: {destinoDescripcion}
									</div>
									{invalidSucursalMessage ? (
										<div className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">
											{invalidSucursalMessage}
										</div>
									) : null}
								</div>
							)}
							<div className="grid gap-2">
								<button
									type="button"
									onClick={() => navigate('/cliente/productos')}
									className="rounded-xl border border-neutral-200 px-3 py-2 text-sm font-semibold text-neutral-800 hover:bg-neutral-50"
								>
									Continuar comprando
								</button>
								<button
									type="button"
									disabled={items.length === 0 || superaCredito}
									onClick={confirmarPedido}
									className="rounded-xl bg-brand-red px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
								>
									Confirmar pedido
								</button>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	)
}
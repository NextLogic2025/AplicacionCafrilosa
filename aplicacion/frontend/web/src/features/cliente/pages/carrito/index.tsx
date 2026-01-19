import React from 'react'
import { Trash2, Minus, Plus, CheckCircle2, Info, ShoppingCart } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { useCart } from '../../cart/CartContext'
import { useCliente } from '../../hooks/useCliente'
import { Alert } from 'components/ui/Alert'
import { SectionHeader } from 'components/ui/SectionHeader'
import { PageHero } from 'components/ui/PageHero'

export default function PaginaCarrito() {
	const navigate = useNavigate()
	const { items, total, updateQuantity, removeItem, clearCart } = useCart()
	const { crearPedidoDesdeCarrito, perfil } = useCliente()

	const creditoDisponible = Math.max((perfil?.creditLimit || 0) - (perfil?.currentDebt || 0), 0)
	const superaCredito = total > creditoDisponible
  const condicionComercial = superaCredito ? 'Contado' : 'Crédito'

	const confirmarPedido = () => {
		if (items.length === 0) return
		if (superaCredito) return
		crearPedidoDesdeCarrito(items, total)
		clearCart()
		navigate('/cliente/pedidos', { replace: true })
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
				<div className="grid gap-4 lg:grid-cols-3">
					<div className="lg:col-span-2 space-y-3">
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

					<div className="space-y-3 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
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
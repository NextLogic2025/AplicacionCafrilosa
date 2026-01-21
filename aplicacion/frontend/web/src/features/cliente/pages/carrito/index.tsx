
import { useNavigate } from 'react-router-dom'
import { PageHero } from 'components/ui/PageHero'
import { SectionHeader } from 'components/ui/SectionHeader'

import { useCarritoPage } from './hooks/useCarritoPage'
import { CartList } from './components/CartList'
import { OrderSummary } from './components/OrderSummary'

export default function PaginaCarrito() {
	const navigate = useNavigate()
	const {
		items,
		total,
		updateQuantity,
		removeItem,
		clearCart,
		warnings,
		removedItems,
		sucursales,
		selectedSucursalId,
		setSelectedSucursalId,
		destinoTipo,
		invalidSucursalMessage,
		creditoDisponible,
		superaCredito,
		condicionComercial,
		destinoDescripcion,
		handleDestinoTipoChange,
		confirmarPedido
	} = useCarritoPage()

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
						<CartList
							items={items}
							updateQuantity={updateQuantity}
							removeItem={removeItem}
							warnings={warnings}
							removedItems={removedItems}
						/>

						<OrderSummary
							total={total}
							creditoDisponible={creditoDisponible}
							superaCredito={superaCredito}
							condicionComercial={condicionComercial}
							itemsCount={items.length}
							confirmarPedido={confirmarPedido}
							goToProducts={() => navigate('/cliente/productos')}
							destinoTipo={destinoTipo}
							handleDestinoTipoChange={handleDestinoTipoChange}
							sucursales={sucursales}
							selectedSucursalId={selectedSucursalId}
							setSelectedSucursalId={setSelectedSucursalId}
							destinoDescripcion={destinoDescripcion}
							invalidSucursalMessage={invalidSucursalMessage}
						/>
					</div>
				)}
			</div>
		</div>
	)
}

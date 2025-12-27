import React, { useEffect, useMemo } from 'react'
import {
	AlertCircle,
	Bell,
	CheckCircle2,
	ClipboardList,
	CreditCard,
	LifeBuoy,
	Package,
	Plus,
	Truck,
	Wallet,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { EstadoFactura, EstadoPedido } from '../../types'
import { useCliente } from '../../hooks/useCliente'
import { LoadingSpinner } from '../../components/LoadingSpinner'
import { Alert } from '../../components/Alert'

export default function PaginaPanelCliente() {
	const navigate = useNavigate()
	const {
		perfil,
		pedidos,
		facturas,
		entregas,
		notificaciones,
		conversaciones,
		error,
		cargando,
		fetchPerfilCliente,
		fetchPedidos,
		fetchFacturas,
		fetchEntregas,
		fetchNotificaciones,
		fetchConversaciones,
		limpiarError,
	} = useCliente()

	useEffect(() => {
		fetchPerfilCliente()
		fetchPedidos(1)
		fetchFacturas()
		fetchEntregas()
		fetchNotificaciones()
		fetchConversaciones()
	}, [fetchConversaciones, fetchEntregas, fetchFacturas, fetchNotificaciones, fetchPedidos, fetchPerfilCliente])

	const creditoDisponible = useMemo(
		() => Math.max((perfil?.creditLimit || 0) - (perfil?.currentDebt || 0), 0),
		[perfil],
	)

	const pedidosPendientes = pedidos.filter(p => p.status === EstadoPedido.PENDING || p.status === EstadoPedido.APPROVED)
	const pedidosRecientes = pedidos.slice(0, 3)
	const facturasPendientes = facturas.filter(f => f.status === EstadoFactura.PENDING || f.status === EstadoFactura.OVERDUE)
	const entregasEnRuta = entregas.filter(e => e.currentStatus === 'in_transit')
	const conversacionesAbiertas = conversaciones.length
	const notificacionesNoLeidas = notificaciones.filter(n => !n.read).length

	if (cargando && !perfil) {
		return <LoadingSpinner text="Cargando tu panel..." />
	}

	return (
		<div className="space-y-5">
			{error && <Alert type="error" title="Error" message={error} onClose={limpiarError} />}

			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				<MetricCard
					title="Saldo pendiente"
					value={`$${perfil?.currentDebt?.toFixed(2) || '0.00'}`}
					subtitle="Estado financiero"
					icon={<Wallet className="h-5 w-5" />}
					tone="red"
				/>
				<MetricCard
					title="Crédito disponible"
					value={`$${creditoDisponible.toFixed(2)}`}
					subtitle={`Límite: $${perfil?.creditLimit?.toFixed(2) || '0.00'}`}
					icon={<CreditCard className="h-5 w-5" />}
					tone="gold"
				/>
				<MetricCard
					title="Pedidos activos"
					value={`${pedidosPendientes.length}`}
					subtitle="Pendiente o aprobado"
					icon={<ClipboardList className="h-5 w-5" />}
					tone="green"
					onClick={() => navigate('/cliente/pedidos')}
				/>
				<MetricCard
					title="Notificaciones"
					value={`${notificacionesNoLeidas}`}
					subtitle="Sin leer"
					icon={<Bell className="h-5 w-5" />}
					tone="blue"
					onClick={() => navigate('/cliente/notificaciones')}
				/>
			</div>

			<div className="grid gap-4 lg:grid-cols-3">
				<Card title="Pedidos recientes" actionLabel="Ver pedidos" onAction={() => navigate('/cliente/pedidos')}>
					<div className="space-y-3">
						{pedidosRecientes.length === 0 ? (
							<EmptyState text="Aún no hay pedidos registrados." />
						) : (
							pedidosRecientes.map(pedido => (
								<div key={pedido.id} className="rounded-2xl border border-neutral-100 bg-neutral-50 px-3 py-2">
									<div className="flex items-center justify-between gap-3">
										<div>
											<p className="text-sm font-semibold text-neutral-900">Pedido {pedido.orderNumber}</p>
											<p className="text-xs text-neutral-500">{new Date(pedido.createdAt).toLocaleDateString()}</p>
										</div>
										<span className="rounded-full bg-brand-red/10 px-3 py-1 text-xs font-semibold text-brand-red">
											{formatEstadoPedido(pedido.status)}
										</span>
									</div>
									<p className="text-sm font-bold text-neutral-900">${pedido.totalAmount.toFixed(2)}</p>
								</div>
							))
						)}
					</div>
				</Card>

				<Card title="Alertas importantes" actionLabel="Ir a facturas" onAction={() => navigate('/cliente/facturas')}>
					<div className="space-y-2">
						{facturasPendientes.length === 0 ? (
							<div className="flex items-center gap-2 rounded-xl bg-green-50 px-3 py-2 text-sm text-green-800">
								<CheckCircle2 className="h-4 w-4" />
								Sin facturas pendientes
							</div>
						) : (
							facturasPendientes.map(factura => (
								<div key={factura.id} className="flex items-center gap-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800">
									<AlertCircle className="h-4 w-4" />
									<div>
										<p className="font-semibold">Factura {factura.invoiceNumber}</p>
										<p className="text-xs">Vence: {new Date(factura.dueDate).toLocaleDateString()}</p>
									</div>
									<span className="ml-auto rounded-full bg-white/60 px-2 py-0.5 text-xs font-semibold text-red-800">
										${factura.total.toFixed(2)}
									</span>
								</div>
							))
						)}
					</div>
				</Card>

				<Card title="Acciones rápidas">
					<div className="grid gap-2">
						<QuickAction label="Crear nuevo pedido" icon={<Plus className="h-4 w-4" />} onClick={() => navigate('/cliente/productos')} />
						<QuickAction label="Revisar entregas" icon={<Truck className="h-4 w-4" />} onClick={() => navigate('/cliente/entregas')} />
						<QuickAction label="Abrir ticket de soporte" icon={<LifeBuoy className="h-4 w-4" />} onClick={() => navigate('/cliente/soporte')} />
						<QuickAction label="Ver estado de crédito" icon={<CreditCard className="h-4 w-4" />} onClick={() => navigate('/cliente/facturas')} />
					</div>
				</Card>
			</div>

			<div className="grid gap-4 lg:grid-cols-2">
				<Card title="Estado de pedidos" actionLabel="Ver historial" onAction={() => navigate('/cliente/pedidos')}>
					<div className="grid grid-cols-2 gap-3 md:grid-cols-3">
						{[
							{ label: 'Pendiente', value: pedidos.filter(p => p.status === EstadoPedido.PENDING).length },
							{ label: 'Aprobado', value: pedidos.filter(p => p.status === EstadoPedido.APPROVED).length },
							{ label: 'En ruta', value: pedidos.filter(p => p.status === EstadoPedido.IN_TRANSIT).length },
							{ label: 'Entregado', value: pedidos.filter(p => p.status === EstadoPedido.DELIVERED).length },
							{ label: 'Facturado', value: facturas.length },
							{ label: 'Cancelado', value: pedidos.filter(p => p.status === EstadoPedido.CANCELLED).length },
						].map(item => (
							<div key={item.label} className="rounded-xl border border-neutral-100 bg-neutral-50 px-3 py-2 text-center">
								<p className="text-xs text-neutral-500">{item.label}</p>
								<p className="text-lg font-bold text-neutral-900">{item.value}</p>
							</div>
						))}
					</div>
				</Card>

				<Card title="Entregas" actionLabel="Rastrear" onAction={() => navigate('/cliente/entregas')}>
					<div className="space-y-2">
						{entregasEnRuta.length === 0 ? (
							<EmptyState text="No hay entregas en ruta." />
						) : (
							entregasEnRuta.map(entrega => (
								<div key={entrega.id} className="flex items-center gap-3 rounded-xl bg-blue-50 px-3 py-2 text-sm text-blue-900">
									<Truck className="h-4 w-4" />
									<div className="flex-1">
										<p className="font-semibold">Pedido {entrega.orderId}</p>
										<p className="text-xs">Transportista: {entrega.carrier}</p>
									</div>
									<span className="rounded-full bg-white/70 px-2 py-0.5 text-xs font-semibold text-blue-900">En ruta</span>
								</div>
							))
						)}
					</div>
				</Card>
			</div>

			<div className="grid gap-4 lg:grid-cols-2">
				<Card title="Promociones activas">
					<div className="rounded-2xl border border-dashed border-brand-red/40 bg-brand-red/5 px-4 py-3 text-sm text-brand-red">
						10% de descuento en línea de embutidos premium hasta el 30/01.
					</div>
				</Card>

				<Card title="Soporte y mensajes" actionLabel="Ir a soporte" onAction={() => navigate('/cliente/soporte')}>
					<div className="space-y-2">
						<div className="flex items-center gap-2 rounded-xl bg-neutral-50 px-3 py-2 text-sm text-neutral-800">
							<LifeBuoy className="h-4 w-4 text-brand-red" />
							Tickets abiertos: <span className="font-semibold">{conversacionesAbiertas}</span>
						</div>
						<div className="flex items-center gap-2 rounded-xl bg-neutral-50 px-3 py-2 text-sm text-neutral-800">
							<Bell className="h-4 w-4 text-brand-red" />
							Notificaciones pendientes: <span className="font-semibold">{notificacionesNoLeidas}</span>
						</div>
					</div>
				</Card>
			</div>
		</div>
	)
}

function MetricCard({
	title,
	value,
	subtitle,
	icon,
	tone = 'red',
	onClick,
}: {
	title: string
	value: string
	subtitle?: string
	icon: React.ReactNode
	tone?: 'red' | 'gold' | 'green' | 'blue'
	onClick?: () => void
}) {
	const palettes = {
		red: { bg: 'bg-red-50', text: 'text-brand-red' },
		gold: { bg: 'bg-amber-50', text: 'text-amber-700' },
		green: { bg: 'bg-emerald-50', text: 'text-emerald-700' },
		blue: { bg: 'bg-sky-50', text: 'text-sky-700' },
	}
	const palette = palettes[tone]

	return (
		<button
			type="button"
			onClick={onClick}
			className="flex flex-col gap-1 rounded-2xl border border-neutral-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
		>
			<div className={`mb-2 flex h-10 w-10 items-center justify-center rounded-xl ${palette.bg} ${palette.text}`}>{icon}</div>
			<p className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">{title}</p>
			<p className="text-2xl font-bold text-neutral-900">{value}</p>
			{subtitle ? <p className="text-xs text-neutral-500">{subtitle}</p> : null}
		</button>
	)
}

function Card({
	title,
	children,
	actionLabel,
	onAction,
}: {
	title: string
	children: React.ReactNode
	actionLabel?: string
	onAction?: () => void
}) {
	return (
		<div className="flex h-full flex-col gap-3 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
			<div className="flex items-center justify-between gap-3">
				<h3 className="text-sm font-semibold text-neutral-800">{title}</h3>
				{actionLabel && onAction ? (
					<button
						type="button"
						className="text-xs font-semibold text-brand-red underline-offset-2 hover:underline"
						onClick={onAction}
					>
						{actionLabel}
					</button>
				) : null}
			</div>
			{children}
		</div>
	)
}

function QuickAction({ label, icon, onClick }: { label: string; icon: React.ReactNode; onClick: () => void }) {
	return (
		<button
			type="button"
			onClick={onClick}
			className="flex items-center gap-2 rounded-xl border border-neutral-200 px-3 py-2 text-sm font-semibold text-neutral-800 transition hover:-translate-y-0.5 hover:border-brand-red hover:bg-brand-red/5"
		>
			<span className="text-brand-red">{icon}</span>
			{label}
		</button>
	)
}

function EmptyState({ text }: { text: string }) {
	return <p className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50 px-3 py-3 text-sm text-neutral-500">{text}</p>
}

function formatEstadoPedido(estado: EstadoPedido) {
	const labels: Record<EstadoPedido, string> = {
		[EstadoPedido.PENDING]: 'Pendiente',
		[EstadoPedido.APPROVED]: 'Aprobado',
		[EstadoPedido.IN_PREPARATION]: 'En preparación',
		[EstadoPedido.IN_TRANSIT]: 'En ruta',
		[EstadoPedido.DELIVERED]: 'Entregado',
		[EstadoPedido.CANCELLED]: 'Cancelado',
	}
	return labels[estado]
}
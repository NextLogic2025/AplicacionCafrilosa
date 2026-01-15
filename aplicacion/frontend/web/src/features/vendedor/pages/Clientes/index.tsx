import { useEffect, useMemo, useState } from 'react'
import type { KeyboardEvent, MouseEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, Plus, Search, UserPlus, Building2, DollarSign, CheckCircle, XCircle, ShoppingCart, Navigation } from 'lucide-react'

import { PageHero } from '../../../../components/ui/PageHero'
import { ActionButton } from '../../../../components/ui/ActionButton'
import { StatusBadge } from '../../../../components/ui/StatusBadge'
import { EmptyContent } from '../../../../components/ui/EmptyContent'
import { LoadingSpinner } from '../../../../components/ui/LoadingSpinner'
import { QuickActionButton } from '../../../../components/ui/Cards'
import { getClientesAsignados } from '../../services/vendedorApi'
import { ClienteDetailModal, getClienteDisplayName, getClienteSecondaryName } from './ClienteDetailModal'
import type { Cliente } from '../../../supervisor/services/clientesApi'

const ESTADOS = [
  { value: '', label: 'Todos' },
  { value: 'activo', label: 'Activo' },
  { value: 'bloqueado', label: 'Bloqueado' },
  { value: 'inactivo', label: 'Inactivo' },
]

export default function VendedorClientes() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filtroBusqueda, setFiltroBusqueda] = useState('')
  const [zonaFiltro, setZonaFiltro] = useState('')
  const [estadoFiltro, setEstadoFiltro] = useState('')
  const [detalleCliente, setDetalleCliente] = useState<Cliente | null>(null)
  const [isDetalleOpen, setIsDetalleOpen] = useState(false)

  useEffect(() => {
    let isMounted = true
    const cargar = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const data = await getClientesAsignados()
        if (isMounted) setClientes(data)
      } catch (err) {
        console.error('Error al cargar clientes asignados', err)
        if (isMounted) {
          setError('No se pudieron cargar los clientes asignados.')
          setClientes([])
        }
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }
    cargar()
    return () => {
      isMounted = false
    }
  }, [])

  const zonaOptions = useMemo(() => {
    const map = new Map<string, string>()
    clientes.forEach((cliente) => {
      const id = cliente.zona_comercial?.id ?? cliente.zona_comercial_id
      if (id != null) {
        const key = String(id)
        if (!map.has(key)) {
          const nombre = cliente.zona_comercial?.nombre?.trim()
          map.set(key, nombre && nombre.length > 0 ? nombre : `Zona ${key}`)
        }
      } else if (!map.has('sin-zona')) {
        map.set('sin-zona', 'Sin zona asignada')
      }
    })
    return Array.from(map.entries()).map(([value, label]) => ({ value, label }))
  }, [clientes])

  const clientesFiltrados = useMemo(() => {
    const term = filtroBusqueda.trim().toLowerCase()
    return clientes.filter((cliente) => {
      if (term) {
        const matches = [cliente.razon_social, cliente.nombre_comercial, cliente.identificacion]
          .filter(Boolean)
          .some((campo) => campo!.toLowerCase().includes(term))
        if (!matches) return false
      }

      if (zonaFiltro) {
        const zonaKey = cliente.zona_comercial?.id ?? cliente.zona_comercial_id
        const value = zonaKey != null ? String(zonaKey) : 'sin-zona'
        if (zonaFiltro !== value) return false
      }

      if (estadoFiltro) {
        const estadoActual = cliente.bloqueado ? 'bloqueado' : cliente.deleted_at ? 'inactivo' : 'activo'
        if (estadoFiltro !== estadoActual) return false
      }

      return true
    })
  }, [clientes, filtroBusqueda, zonaFiltro, estadoFiltro])

  const handleVerDetalle = (cliente: Cliente) => {
    setDetalleCliente(cliente)
    setIsDetalleOpen(true)
  }

  const handleCerrarDetalle = () => {
    setIsDetalleOpen(false)
    setDetalleCliente(null)
  }

  return (
    <div className="space-y-6">
      <PageHero
        title="Mis Clientes"
        subtitle="Gestiona tu cartera de clientes asignados"
        chips={[
          { label: 'Cartera asignada', variant: 'blue' },
          { label: 'Registro de prospectos', variant: 'green' },
        ]}
      />

      <section className="flex flex-wrap gap-3">
        <ActionButton variant="primary" icon={<UserPlus className="h-4 w-4" />}>
          Registrar Prospecto
        </ActionButton>
        <ActionButton variant="secondary" icon={<Plus className="h-4 w-4" />}>
          Solicitar Alta de Cliente
        </ActionButton>
      </section>

      <section className="rounded-xl border border-neutral-200 bg-white p-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="mb-2 block text-sm font-medium text-neutral-700">
              Buscar Cliente
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="Razón social o identificación"
                value={filtroBusqueda}
                onChange={(event) => setFiltroBusqueda(event.target.value)}
                className="w-full rounded-lg border border-neutral-200 py-2 pl-10 pr-4 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-red"
              />
            </div>
          </div>

          <div className="w-48 min-w-[180px]">
            <label className="mb-2 block text-sm font-medium text-neutral-700">
              Zona
            </label>
            <select
              value={zonaFiltro}
              onChange={(event) => setZonaFiltro(event.target.value)}
              className="w-full rounded-lg border border-neutral-200 px-4 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-red"
            >
              <option value="">Todas</option>
              {zonaOptions.map((zona) => (
                <option key={zona.value} value={zona.value}>
                  {zona.label}
                </option>
              ))}
            </select>
          </div>

          <div className="w-48 min-w-[180px]">
            <label className="mb-2 block text-sm font-medium text-neutral-700">
              Estado
            </label>
            <select
              value={estadoFiltro}
              onChange={(event) => setEstadoFiltro(event.target.value)}
              className="w-full rounded-lg border border-neutral-200 px-4 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-red"
            >
              {ESTADOS.map((estado) => (
                <option key={estado.value || 'todos'} value={estado.value}>
                  {estado.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-neutral-200 bg-white p-6">
        <h3 className="mb-4 text-lg font-bold text-neutral-950">Cartera de Clientes</h3>
        {error && (
          <div className="mb-4 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-10">
            <LoadingSpinner text="Cargando clientes asignados..." />
          </div>
        ) : clientesFiltrados.length === 0 ? (
          <EmptyContent
            icon={<Users className="h-16 w-16" />}
            title="No hay clientes registrados"
            description="Los clientes asignados a tu cartera aparecerán aquí"
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {clientesFiltrados.map((cliente) => (
              <ClienteAsignadoCard key={cliente.id} cliente={cliente} onView={handleVerDetalle} />
            ))}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-blue-200 bg-blue-50 p-6">
        <h4 className="mb-2 font-semibold text-blue-900">Gestión de Clientes</h4>
        <ul className="space-y-1 text-sm text-blue-800">
          <li>✓ Puedes registrar prospectos para futuras activaciones</li>
          <li>✓ La solicitud de alta requiere aprobación del supervisor</li>
          <li>✓ Visualiza el historial completo de pedidos y pagos de cada cliente</li>
          <li>✓ Inicia pedidos directamente desde la ficha del cliente</li>
        </ul>
      </section>

      <ClienteDetailModal
        isOpen={isDetalleOpen}
        onClose={handleCerrarDetalle}
        cliente={detalleCliente}
      />
    </div>
  )
}

function ClienteAsignadoCard({ cliente, onView }: { cliente: Cliente; onView?: (cliente: Cliente) => void }) {
  const navigate = useNavigate()
  const estado = cliente.bloqueado ? 'bloqueado' : cliente.deleted_at ? 'inactivo' : 'activo'
  const estadoVariant = estado === 'activo' ? 'success' : estado === 'bloqueado' ? 'error' : 'neutral'
  const estadoLabel = estado === 'bloqueado' ? 'Bloqueado' : estado === 'inactivo' ? 'Inactivo' : 'Activo'
  const zonaNombre = cliente.zona_comercial?.nombre ?? (cliente.zona_comercial_id != null ? `Zona ${cliente.zona_comercial_id}` : 'Sin zona asignada')
  const listaNombre = cliente.lista_precios?.nombre ?? (cliente.lista_precios_id != null ? `Lista ${cliente.lista_precios_id}` : null)
  const coords = getClienteCoords(cliente)
  const displayName = getClienteDisplayName(cliente)
  const secondaryName = getClienteSecondaryName(cliente, displayName)

  const limite = Number.parseFloat(cliente.limite_credito ?? '0')
  const saldo = Number.parseFloat(cliente.saldo_actual ?? '0')
  const tieneValoresCredito = Number.isFinite(limite) && Number.isFinite(saldo)
  const creditoDisponible = tieneValoresCredito ? (limite - saldo).toFixed(2) : null

  const estadoIcon = estado === 'activo' ? (
    <CheckCircle className="h-3.5 w-3.5" />
  ) : estado === 'bloqueado' ? (
    <XCircle className="h-3.5 w-3.5" />
  ) : null

  const handleCardClick = () => {
    if (onView) onView(cliente)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!onView) return
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onView(cliente)
    }
  }

  const handleVerDetalles = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    event.preventDefault()
    onView?.(cliente)
  }

  const handleIniciarPedido = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    event.preventDefault()
    navigate(`/vendedor/carrito?cliente=${cliente.id}`)
  }

  const handleComoLlegar = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    event.preventDefault()
    if (!coords) return
    const url = buildDirectionsUrl(coords.lat, coords.lng)
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div
      role={onView ? 'button' : undefined}
      tabIndex={onView ? 0 : undefined}
      onClick={onView ? handleCardClick : undefined}
      onKeyDown={onView ? handleKeyDown : undefined}
      className={`group relative overflow-hidden rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${onView ? 'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red/50' : ''}`}
    >
        <div className="mb-4 flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-neutral-900">{displayName}</h3>
          {secondaryName && <p className="text-sm text-neutral-600">{secondaryName}</p>}
          {/* Mostrar nombre de contacto si viene en la entidad y no está repetido */}
          {(cliente as any).contacto_nombre &&
            ((cliente as any).contacto_nombre as string).trim().length > 0 &&
            (String((cliente as any).contacto_nombre).toLowerCase() !== String(displayName).toLowerCase()) && (
              <p className="text-sm text-neutral-600">Contacto: {(cliente as any).contacto_nombre}</p>
            )}
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-brand-red">
          <Building2 className="h-5 w-5" />
        </div>
      </div>

      <div className="space-y-2 border-b border-neutral-200 pb-4 text-sm text-neutral-700">
        <div className="flex items-center justify-between text-sm">
          <span className="text-neutral-600">Identificación:</span>
          <span className="font-semibold text-neutral-900">
            {cliente.tipo_identificacion}: {cliente.identificacion}
          </span>
        </div>
        {zonaNombre && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-neutral-600">Zona:</span>
            <span className="font-semibold text-neutral-900">{zonaNombre}</span>
          </div>
        )}
        {listaNombre && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-neutral-600">Lista de precios:</span>
            <span className="font-semibold text-neutral-900">{listaNombre}</span>
          </div>
        )}
        {cliente.direccion_texto && (
          <div className="flex items-start gap-2 text-sm">
            <span className="flex-shrink-0 text-neutral-600">Dirección:</span>
            <span className="text-neutral-900">{cliente.direccion_texto}</span>
          </div>
        )}
      </div>

      {cliente.tiene_credito && creditoDisponible != null && (
        <div className="mt-4 space-y-2 rounded-2xl bg-neutral-50 p-4">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-emerald-600" />
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-neutral-600">Información de crédito</span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-neutral-500">Límite</p>
              <p className="font-semibold text-neutral-900">${limite.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-neutral-500">Saldo</p>
              <p className="font-semibold text-neutral-900">${saldo.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-neutral-500">Disponible</p>
              <p className="font-semibold text-emerald-600">${creditoDisponible}</p>
            </div>
            <div>
              <p className="text-xs text-neutral-500">Plazo</p>
              <p className="font-semibold text-neutral-900">{cliente.dias_plazo} días</p>
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <StatusBadge variant={estadoVariant}>
          <span className="flex items-center gap-1">
            {estadoIcon}
            {estadoLabel}
          </span>
        </StatusBadge>
        {cliente.tiene_credito && tieneValoresCredito && (
          <StatusBadge variant="info">
            <span className="flex items-center gap-1">
              <DollarSign className="h-3.5 w-3.5" />
              Con crédito
            </span>
          </StatusBadge>
        )}
      </div>

      <div className="mt-3 text-xs text-neutral-500">
        Creado: {new Date(cliente.created_at).toLocaleDateString('es-EC')}
      </div>

      {onView && (
        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <QuickActionButton label="Iniciar pedido" icon={<ShoppingCart className="h-4 w-4" />} onClick={handleIniciarPedido} />
          {coords && (
            <QuickActionButton label="Cómo llegar" icon={<Navigation className="h-4 w-4" />} onClick={handleComoLlegar} />
          )}
          <QuickActionButton label="Ver detalles" icon={<Building2 className="h-4 w-4" />} onClick={handleVerDetalles} />
        </div>
      )}
    </div>
  )
}

function getClienteCoords(cliente: Cliente): { lat: number; lng: number } | null {
  if (cliente.ubicacion_gps?.coordinates) {
    return {
      lat: cliente.ubicacion_gps.coordinates[1],
      lng: cliente.ubicacion_gps.coordinates[0],
    }
  }
  if (typeof cliente.latitud === 'number' && typeof cliente.longitud === 'number') {
    return { lat: cliente.latitud, lng: cliente.longitud }
  }
  return null
}

function buildDirectionsUrl(lat: number, lng: number): string {
  const destination = `${lat},${lng}`
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`
}

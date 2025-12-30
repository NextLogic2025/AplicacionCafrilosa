import { useState, useEffect, useMemo } from 'react'
import { Trash2, Bell } from 'lucide-react'
import { useCliente } from '../../hooks/useCliente'
import { LoadingSpinner } from 'components/ui/LoadingSpinner'
import { Alert } from 'components/ui/Alert'
import { SectionHeader } from 'components/ui/SectionHeader'
import { StatCard } from 'components/ui/StatCard'
import { FilterGroup } from 'components/ui/FilterButton'
import { PageHero } from 'components/ui/PageHero'
import { Notificacion, TipoNotificacion } from '../../types'

interface FiltrosNotificacion {
  type: TipoNotificacion | 'all'
  read: 'all' | 'unread' | 'read'
}

export default function PaginaNotificaciones() {
  const { notificaciones, fetchNotificaciones, marcarNotificacionComoLeida, marcarTodasComoLeidas, error } = useCliente()
  const [cargando, setCargando] = useState(true)
  const [filtros, setFiltros] = useState<FiltrosNotificacion>({ type: 'all', read: 'all' })

  useEffect(() => {
    const cargar = async () => {
      setCargando(true)
      await fetchNotificaciones()
      setCargando(false)
    }
    cargar()
  }, [fetchNotificaciones])

  const configTipo = {
    [TipoNotificacion.ORDER]: { label: 'Pedidos', icon: '📦', color: 'bg-blue-50 border-blue-200' },
    [TipoNotificacion.INVOICE]: { label: 'Facturas', icon: '📄', color: 'bg-green-50 border-green-200' },
    [TipoNotificacion.DELIVERY]: { label: 'Entregas', icon: '🚚', color: 'bg-yellow-50 border-yellow-200' },
    [TipoNotificacion.PROMOTIONAL]: { label: 'Promociones', icon: '🎉', color: 'bg-purple-50 border-purple-200' },
    [TipoNotificacion.SYSTEM]: { label: 'Sistema', icon: '⚙️', color: 'bg-gray-50 border-gray-200' },
    [TipoNotificacion.SUPPORT]: { label: 'Soporte', icon: '💬', color: 'bg-red-50 border-red-200' },
  }

  const notificacionesFiltradas = useMemo(
    () =>
      notificaciones.filter(notif => {
        const coincideTipo = filtros.type === 'all' || notif.type === filtros.type
        const coincideLectura =
          filtros.read === 'all' ||
          (filtros.read === 'unread' && !notif.read) ||
          (filtros.read === 'read' && notif.read)
        return coincideTipo && coincideLectura
      }),
    [filtros.read, filtros.type, notificaciones],
  )

  const noLeidas = useMemo(() => notificaciones.filter(n => !n.read).length, [notificaciones])

  const marcarLeida = async (id: string) => {
    await marcarNotificacionComoLeida(id)
  }

  return (
    <div className="space-y-6">
      <PageHero
        title="Notificaciones"
        subtitle="Mantente actualizado con notificaciones de pedidos, entregas y promociones"
        chips={[
          'Alertas de pedidos',
          'Novedades de productos',
          'Ofertas personalizadas',
        ]}
      />

      {error && <Alert type="error" title="Error" message={error} />}

      <SectionHeader
        title="Notificaciones"
        subtitle="Mantente actualizado con tus notificaciones"
        rightSlot={
          noLeidas > 0 ? (
            <button
              onClick={marcarTodasComoLeidas}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white transition hover:bg-blue-700"
            >
              Marcar todo como leído ({noLeidas})
            </button>
          ) : null
        }
      />

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="No leídas" value={noLeidas} color="red" />
        <StatCard label="Total" value={notificaciones.length} color="blue" />
        <StatCard
          label="Esta semana"
          value={notificaciones.filter(n => {
            const fecha = new Date(n.createdAt)
            const semanaPasada = new Date()
            semanaPasada.setDate(semanaPasada.getDate() - 7)
            return fecha > semanaPasada
          }).length}
          color="gray"
        />
      </div>

      <FilterGroup
        filters={[
          { value: 'all', label: 'Todas' },
          { value: 'unread', label: 'No leídas', count: noLeidas },
          { value: 'read', label: 'Leídas' },
        ]}
        activeFilter={filtros.read}
        onChange={(value) => setFiltros({ ...filtros, read: value as any })}
      />

      <div className="flex flex-wrap gap-2">
        {(['all', TipoNotificacion.ORDER, TipoNotificacion.INVOICE, TipoNotificacion.DELIVERY, TipoNotificacion.PROMOTIONAL, TipoNotificacion.SYSTEM] as const).map(tipo => (
          <button
            key={tipo}
            onClick={() => setFiltros({ ...filtros, type: tipo })}
            className={`flex items-center gap-1 rounded-lg px-3 py-1 text-sm font-medium transition ${
              filtros.type === tipo ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {tipo === 'all' ? '📌 Todas' : `${configTipo[tipo].icon} ${configTipo[tipo].label}`}
          </button>
        ))}
      </div>

      {cargando ? (
        <LoadingSpinner />
      ) : (
        <div className="space-y-3">
          {notificacionesFiltradas.length > 0 ? (
            notificacionesFiltradas.map(notif => (
              <div
                key={notif.id}
                className={`rounded-lg border-l-4 p-4 transition ${
                  notif.read ? 'border-gray-300 bg-gray-50 opacity-75' : 'border-blue-500 bg-white shadow'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="text-xl">{configTipo[notif.type].icon}</span>
                      <h3 className={`font-semibold ${notif.read ? 'text-gray-600' : 'text-gray-900'}`}>
                        {notif.title}
                      </h3>
                      {!notif.read && <span className="inline-block h-2 w-2 rounded-full bg-blue-600"></span>}
                    </div>
                    <p className={`text-sm ${notif.read ? 'text-gray-600' : 'text-gray-700'}`}>{notif.message}</p>
                    <p className="mt-2 text-xs text-gray-500">
                      {new Date(notif.createdAt).toLocaleDateString('es-ES')}{' '}
                      {new Date(notif.createdAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>

                  <div className="ml-4 flex gap-2">
                    {!notif.read && (
                      <button
                        onClick={() => marcarLeida(notif.id)}
                        className="rounded-lg p-2 text-blue-600 transition hover:bg-blue-100"
                        title="Marcar como leído"
                      >
                        <Bell size={18} />
                      </button>
                    )}
                    <button
                      onClick={() => console.log('Eliminar:', notif.id)}
                      className="rounded-lg p-2 text-gray-600 transition hover:bg-brand-cream hover:text-brand-red"
                      title="Eliminar"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                {notif.relatedId && (
                  <div className="mt-2 border-t border-gray-200 pt-2">
                    <button
                      onClick={() => console.log('Ver:', notif.relatedId)}
                      className="text-xs font-medium text-blue-600 transition hover:text-blue-800"
                    >
                      Ver {notif.type.toLowerCase()} →
                    </button>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="py-12 text-center">
              <Bell size={48} className="mx-auto mb-3 text-gray-300" />
              <p className="text-lg text-gray-600">
                {notificaciones.length === 0 ? 'No tienes notificaciones' : 'No se encontraron notificaciones con estos filtros'}
              </p>
              {notificaciones.length > 0 && (
                <button
                  onClick={() => setFiltros({ type: 'all', read: 'all' })}
                  className="mt-4 font-medium text-blue-600 transition hover:text-blue-700"
                >
                  Limpiar filtros
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

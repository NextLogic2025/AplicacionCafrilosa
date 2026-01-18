import { Bell, Map, Loader2 } from 'lucide-react'
import { PageHero } from 'components/ui/PageHero'
import { EmptyContent } from 'components/ui/EmptyContent'
import { useSocket } from '../../../../hooks/useSocket'
import { Alert } from 'components/ui/Alert'
import { Button } from 'components/ui/Button'

export default function VendedorNotificaciones() {
  const { notifications, isConnected, clearNotifications } = useSocket()

  // Filter for Vendedor notifications: ROUTE_UPDATE
  const routeUpdates = notifications.filter(n => n.type === 'ROUTE_UPDATE')

  return (
    <div className="space-y-6">
      <PageHero
        title="Notificaciones"
        subtitle="Alertas de tus rutas y zonas asignadas"
      />

      {!isConnected && (
        <Alert
          type="warning"
          title="Desconectado"
          message="Conectando con el servidor de notificaciones..."
        />
      )}

      {routeUpdates.length > 0 ? (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button variant="ghost" size="sm" onClick={clearNotifications}>
              Limpiar todo
            </Button>
          </div>
          {routeUpdates.map((notif, index) => (
            <div key={index} className="flex items-start gap-4 p-4 bg-white border border-neutral-200 rounded-xl shadow-sm animate-in fade-in slide-in-from-top-2">
              <div className="p-2 bg-blue-50 rounded-full text-blue-600">
                <Map size={20} />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-neutral-900">{notif.title}</h4>
                <p className="text-sm text-neutral-600 mt-1">{notif.message}</p>
                <span className="text-xs text-neutral-400 mt-2 block">
                  {new Date().toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-neutral-200 p-8">
          <EmptyContent
            icon={Bell}
            title="Sin nuevas alertas de ruta"
            subtitle="Te notificaremos cuando se te asignen nuevas rutas o zonas."
          />
        </div>
      )}
    </div>
  )
}

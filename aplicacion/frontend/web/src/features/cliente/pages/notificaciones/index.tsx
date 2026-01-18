import { Bell, Tag, Sparkles } from 'lucide-react'
import { PageHero } from 'components/ui/PageHero'
import { EmptyContent } from 'components/ui/EmptyContent'
import { useSocket } from '../../../../hooks/useSocket'
import { Alert } from 'components/ui/Alert'
import { Button } from 'components/ui/Button'

export default function NotificacionesClientePage() {
  const { notifications, isConnected, clearNotifications } = useSocket()

  // Filter for Client notifications: PROMO and PROMO_PERSONAL
  const promos = notifications.filter(n => n.type === 'PROMO' || n.type === 'PROMO_PERSONAL')

  return (
    <div className="space-y-6">
      <PageHero
        title="Mis Notificaciones"
        subtitle="Promociones y avisos exclusivos para ti"
      />

      {!isConnected && (
        <Alert
          type="warning"
          title="Desconectado"
          message="Conectando con el servidor de promociones..."
        />
      )}

      {promos.length > 0 ? (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button variant="ghost" size="sm" onClick={clearNotifications}>
              Limpiar todo
            </Button>
          </div>
          {promos.map((notif, index) => (
            <div key={index} className="relative overflow-hidden bg-white border border-neutral-200 rounded-xl shadow-sm p-4 animate-in fade-in slide-in-from-top-2 hover:shadow-md transition-shadow">
              <div className={`absolute top-0 left-0 w-1 h-full ${notif.type === 'PROMO_PERSONAL' ? 'bg-purple-500' : 'bg-brand-red'}`} />
              <div className="flex items-start gap-4">
                <div className={`p-2 rounded-full ${notif.type === 'PROMO_PERSONAL' ? 'bg-purple-50 text-purple-600' : 'bg-red-50 text-brand-red'}`}>
                  {notif.type === 'PROMO_PERSONAL' ? <Sparkles size={20} /> : <Tag size={20} />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-semibold text-neutral-900">{notif.title}</h4>
                    {notif.type === 'PROMO_PERSONAL' && (
                      <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-xs font-medium">Exclusivo</span>
                    )}
                  </div>
                  <p className="text-sm text-neutral-600">{notif.message}</p>
                  <span className="text-xs text-neutral-400 mt-2 block">
                    Recibido: {new Date().toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-neutral-200 p-8">
          <EmptyContent
            icon={Bell}
            title="Estás al día"
            subtitle="Te avisaremos cuando tengamos nuevas promociones o actualizaciones para ti."
          />
        </div>
      )}
    </div>
  )
}

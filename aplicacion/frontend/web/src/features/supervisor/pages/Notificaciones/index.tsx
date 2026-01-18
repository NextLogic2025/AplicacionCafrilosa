import { BarChart3, Bell, CheckCircle2, AlertCircle } from 'lucide-react'
import { PageHero } from 'components/ui/PageHero'
import { EmptyContent } from 'components/ui/EmptyContent'
import { useSocket } from '../../../../hooks/useSocket'
import { Alert } from 'components/ui/Alert'
import { Button } from 'components/ui/Button'

export default function NotificacionesPage() {
    const { notifications, isConnected, clearNotifications } = useSocket()

    // Filter for Supervisor specific notifications if needed, 
    // or assume all notifications sent to this user are relevant.
    // Backend sends type: 'ALERT_SUPERVISOR'
    const alerts = notifications.filter(n => n.type === 'ALERT_SUPERVISOR')

    return (
        <div className="space-y-6">
            <PageHero
                title="Notificaciones"
                subtitle="Centro de alertas y notificaciones en tiempo real"
                chips={[
                    isConnected ? 'Conectado' : 'Desconectado',
                    `${alerts.length} Nuevas`,
                ]}
            />

            {!isConnected && (
                <Alert
                    type="warning"
                    title="Desconectado"
                    message="No hay conexión con el servidor de notificaciones. Intentando reconectar..."
                />
            )}

            {alerts.length > 0 ? (
                <div className="space-y-4">
                    <div className="flex justify-end">
                        <Button variant="ghost" size="sm" onClick={clearNotifications}>
                            Limpiar todo
                        </Button>
                    </div>
                    {alerts.map((notif, index) => (
                        <div key={index} className="flex items-start gap-4 p-4 bg-white border border-neutral-200 rounded-xl shadow-sm animate-in fade-in slide-in-from-top-2">
                            <div className="p-2 bg-red-50 rounded-full text-brand-red">
                                <AlertCircle size={20} />
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
                        title="Sin notificaciones nuevas"
                        subtitle="Te avisaremos cuando ocurran eventos importantes en el sistema."
                    />
                </div>
            )}
        </div>
    )
}

import { Users, CheckCircle, XCircle, Truck } from 'lucide-react'
import { MetricCard } from 'components/ui/Cards'
import { Conductor } from '../../services/conductoresApi'

interface ConductorStatsProps {
    conductores: Conductor[]
}

export function ConductorStats({ conductores }: ConductorStatsProps) {
    const total = conductores.length
    const activos = conductores.filter(c => c.activo).length
    const inactivos = total - activos
    const conLicencia = conductores.filter(c => c.licencia).length

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <MetricCard
                title="Total Conductores"
                value={total.toString()}
                subtitle="Registrados en el sistema"
                icon={<Users className="h-5 w-5" />}
                tone="blue"
            />
            <MetricCard
                title="Activos"
                value={activos.toString()}
                subtitle="Disponibles para rutas"
                icon={<CheckCircle className="h-5 w-5" />}
                tone="green"
            />
            <MetricCard
                title="Inactivos"
                value={inactivos.toString()}
                subtitle="No asignar rutas"
                icon={<XCircle className="h-5 w-5" />}
                tone="red"
            />
            <MetricCard
                title="Con Licencia"
                value={conLicencia.toString()}
                subtitle="Documentación registrada"
                icon={<Truck className="h-5 w-5" />}
                tone="neutral"
            />
        </div>
    )
}

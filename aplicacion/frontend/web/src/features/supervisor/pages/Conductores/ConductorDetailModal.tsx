import { Modal } from 'components/ui/Modal'
import { Conductor } from '../../services/conductoresApi'
import { StatusBadge } from 'components/ui/StatusBadge'
import { User, Phone, FileText, Calendar, ShieldCheck } from 'lucide-react'

interface ConductorDetailModalProps {
    isOpen: boolean
    onClose: () => void
    conductor: Conductor | null
}

export function ConductorDetailModal({ isOpen, onClose, conductor }: ConductorDetailModalProps) {
    if (!conductor) return null

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Detalles del Conductor">
            <div className="space-y-6">
                {/* Header Profile */}
                <div className="flex items-center gap-4 border-b border-neutral-100 pb-6">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                        <User className="h-8 w-8" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-neutral-900">{conductor.nombre_completo}</h3>
                        <p className="text-sm text-neutral-500">ID: {conductor.id}</p>
                    </div>
                    <div className="ml-auto">
                        <StatusBadge variant={conductor.activo ? 'success' : 'neutral'}>
                            {conductor.activo ? 'Activo' : 'Inactivo'}
                        </StatusBadge>
                    </div>
                </div>

                {/* Grid Details */}
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1 rounded-xl bg-neutral-50 p-4">
                        <div className="flex items-center gap-2 text-sm font-semibold text-neutral-700">
                            <ShieldCheck className="h-4 w-4 text-neutral-500" />
                            Identificación
                        </div>
                        <p className="text-lg font-medium text-neutral-900">{conductor.cedula}</p>
                    </div>

                    <div className="space-y-1 rounded-xl bg-neutral-50 p-4">
                        <div className="flex items-center gap-2 text-sm font-semibold text-neutral-700">
                            <Phone className="h-4 w-4 text-neutral-500" />
                            Teléfono
                        </div>
                        <p className="text-lg font-medium text-neutral-900">{conductor.telefono || 'No registrado'}</p>
                    </div>

                    <div className="col-span-1 md:col-span-2 space-y-1 rounded-xl bg-neutral-50 p-4">
                        <div className="flex items-center gap-2 text-sm font-semibold text-neutral-700">
                            <FileText className="h-4 w-4 text-neutral-500" />
                            Licencia de Conducir
                        </div>
                        <p className="text-lg font-medium text-neutral-900">{conductor.licencia || 'No registrada'}</p>
                    </div>
                </div>

                {/* Timestamps */}
                <div className="flex items-center justify-between text-xs text-neutral-400 pt-4 border-t border-neutral-100">
                    <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Registrado: {new Date(conductor.created_at).toLocaleDateString()}
                    </div>
                </div>
            </div>
        </Modal>
    )
}

import { useState, useEffect } from 'react'
import { SectionHeader } from 'components/ui/SectionHeader'
import { PageHero } from 'components/ui/PageHero'
import { Button } from 'components/ui/Button'
import { UserPlus } from 'lucide-react'
import { ConductorStats } from './ConductorStats'
import { ConductoresTable } from './ConductoresTable'
import { ConductorDetailModal } from './ConductorDetailModal'
import { CrearConductorModal } from './CrearConductorModal'
import { getConductores, Conductor } from '../../services/conductoresApi'

export default function ConductoresPage() {
    const [conductores, setConductores] = useState<Conductor[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [selectedConductor, setSelectedConductor] = useState<Conductor | null>(null)
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

    useEffect(() => {
        loadConductores()
    }, [])

    const loadConductores = async () => {
        try {
            setIsLoading(true)
            const data = await getConductores()
            setConductores(data)
        } catch (error) {
            console.error('Error al cargar conductores:', error)
            // If API fails completely, we might want to show empty state or error alert
            setConductores([])
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            <PageHero
                title="Gestión de Conductores"
                subtitle="Administra y supervisa la flota de conductores activos e inactivos."
                chips={[
                    'Flota de transporte',
                    'Control de licencias',
                    'Estado de personal',
                ]}
            />

            <ConductorStats conductores={conductores} />

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <SectionHeader
                        title="Listado de Conductores"
                        subtitle="Vista general del personal de conducción"
                    />
                    <Button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center gap-2 bg-brand-red text-white hover:bg-brand-red/90"
                    >
                        <UserPlus className="h-4 w-4" />
                        Crear Conductor
                    </Button>
                </div>

                <ConductoresTable
                    conductores={conductores}
                    isLoading={isLoading}
                    onView={setSelectedConductor}
                />
            </div>

            <ConductorDetailModal
                isOpen={!!selectedConductor}
                onClose={() => setSelectedConductor(null)}
                conductor={selectedConductor}
            />

            <CrearConductorModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={loadConductores}
            />
        </div>
    )
}

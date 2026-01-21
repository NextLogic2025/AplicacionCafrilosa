
import { PageHero } from 'components/ui/PageHero'
import { Button } from 'components/ui/Button'
import { Plus } from 'lucide-react'

interface StockHeaderProps {
    role: string | null
    onOpenCreate: () => void
}

export function StockHeader({ role, onOpenCreate }: StockHeaderProps) {
    return (
        <>
            <PageHero
                title="Gestión de Stock"
                subtitle="Inventario físico en tiempo real"
            />

            <div className="flex justify-between items-center">
                <div /> {/* Spacer or potential left-side content */}
                {role !== 'vendedor' && (
                    <Button onClick={onOpenCreate} icon={Plus}>
                        Ingreso Inicial
                    </Button>
                )}
            </div>
        </>
    )
}

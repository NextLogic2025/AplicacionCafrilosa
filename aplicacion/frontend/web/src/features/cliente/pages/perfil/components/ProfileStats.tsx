
import { ShoppingBag, Clock } from 'lucide-react'

interface ProfileStatsProps {
    created: string
}

export function ProfileStats({ created }: ProfileStatsProps) {
    return (
        <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 text-sm text-neutral-800">
                <ShoppingBag className="h-4 w-4 text-brand-red" />
                Mantén tu información de contacto actualizada para seguir tu historial de compras.
            </div>
            <p className="mt-2 flex items-center gap-2 text-sm text-neutral-700">
                <Clock className="h-4 w-4 text-brand-red" />
                Alta: {created}
            </p>
        </div>
    )
}

import { Edit, Trash2, RotateCcw, Thermometer, MapPin, Hash } from 'lucide-react'
import { Badge } from 'components/ui/Badge'
import { Button } from 'components/ui/Button'
import { EmptyContent } from 'components/ui/EmptyContent'
import type { Bodega } from '../../../services/bodegaApi'

interface BodegaListProps {
    bodegas: Bodega[]
    onEdit?: (bodega: Bodega) => void
    onDelete?: (id: number) => void
    onRestore?: (id: number) => void
    isDeletedView?: boolean
}

export function BodegaList({ bodegas, onEdit, onDelete, onRestore, isDeletedView }: BodegaListProps) {
    if (bodegas.length === 0) {
        return (
            <EmptyContent
                title="No hay bodegas registradas"
                subtitle={isDeletedView ? "No hay bodegas eliminadas" : "Comienza creando una nueva bodega"}
            />
        )
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {bodegas.map((bodega) => (
                <div
                    key={bodega.id}
                    className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-neutral-200 bg-white p-5 shadow-sm transition-all hover:shadow-md"
                >
                    <div>
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="font-bold text-neutral-900">{bodega.nombre}</h3>
                                <div className="mt-1 flex items-center gap-2 text-sm text-neutral-500">
                                    <Hash className="h-3 w-3" />
                                    <span className="font-mono bg-neutral-100 px-1 rounded text-xs">
                                        {bodega.codigoRef || 'S/N'}
                                    </span>
                                </div>
                            </div>
                            <Badge variant={bodega.activo ? 'success' : 'neutral'}>
                                {bodega.activo ? 'Activo' : 'Inactivo'}
                            </Badge>
                        </div>

                        <div className="mt-4 space-y-2">
                            <div className="flex items-start gap-2 text-sm text-neutral-600">
                                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" />
                                <span className="line-clamp-2">{bodega.direccionFisica || 'Sin dirección'}</span>
                            </div>

                            <div className="flex items-center gap-2 text-sm text-neutral-600">
                                <Thermometer className={`h-4 w-4 shrink-0 ${bodega.requiereFrio ? 'text-blue-500' : 'text-neutral-400'}`} />
                                <span>
                                    {bodega.requiereFrio ? 'Requiere Cadena de Frío' : 'Sin refrigeración'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-5 flex justify-end gap-2 border-t border-neutral-100 pt-4 opacity-0 transition-opacity group-hover:opacity-100">
                        {isDeletedView ? (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onRestore?.(bodega.id)}
                                className="text-green-600 hover:bg-green-50 hover:text-green-700 hover:border-green-200"
                            >
                                <RotateCcw className="mr-1.5 h-3 w-3" />
                                Restaurar
                            </Button>
                        ) : (
                            <>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onEdit?.(bodega)}
                                    className="text-blue-600 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200"
                                >
                                    <Edit className="mr-1.5 h-3 w-3" />
                                    Editar
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onDelete?.(bodega.id)}
                                    className="text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-200"
                                >
                                    <Trash2 className="mr-1.5 h-3 w-3" />
                                    Eliminar
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            ))}
        </div>
    )
}

import { Building2, CheckCircle, XCircle, DollarSign, User } from 'lucide-react'
import { type Cliente } from '../../services/clientesApi'

const ESTADO_COLORES: Record<string, string> = {
  activo: 'bg-green-100 text-green-800',
  bloqueado: 'bg-red-100 text-red-800',
  inactivo: 'bg-gray-100 text-gray-800',
}

interface ClienteCardProps {
  cliente: Cliente
}

export function ClienteCard({ cliente }: ClienteCardProps) {
  const estado = cliente.bloqueado ? 'bloqueado' : cliente.deleted_at ? 'inactivo' : 'activo'
  const estadoColor = ESTADO_COLORES[estado] || 'bg-gray-100 text-gray-800'

  const creditoDisponible =
    cliente.tiene_credito && cliente.limite_credito
      ? (parseFloat(cliente.limite_credito) - parseFloat(cliente.saldo_actual)).toFixed(2)
      : '0.00'

  return (
    <div className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md">
      {/* Encabezado */}
      <div className="mb-4 flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900">{cliente.razon_social}</h3>
          {cliente.nombre_comercial && (
            <p className="text-sm text-gray-600">{cliente.nombre_comercial}</p>
          )}
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
          <Building2 className="h-5 w-5 text-blue-600" />
        </div>
      </div>

      {/* Información básica */}
      <div className="space-y-2 border-b border-gray-200 pb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Identificación:</span>
          <span className="font-medium text-gray-900">
            {cliente.tipo_identificacion}: {cliente.identificacion}
          </span>
        </div>
        {cliente.direccion_texto && (
          <div className="flex items-start gap-2 text-sm">
            <span className="flex-shrink-0 text-gray-600">Dirección:</span>
            <span className="line-clamp-2 text-gray-900">{cliente.direccion_texto}</span>
          </div>
        )}
      </div>

      {/* Información de crédito */}
      {cliente.tiene_credito && (
        <div className="mt-4 space-y-2 border-b border-gray-200 pb-4">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-green-600" />
            <span className="text-xs font-semibold text-gray-600">INFORMACIÓN DE CRÉDITO</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-xs text-gray-500">Límite</p>
              <p className="font-semibold text-gray-900">${cliente.limite_credito}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Saldo</p>
              <p className="font-semibold text-gray-900">${cliente.saldo_actual}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Disponible</p>
              <p className="font-semibold text-green-600">${creditoDisponible}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Plazo</p>
              <p className="font-semibold text-gray-900">{cliente.dias_plazo} días</p>
            </div>
          </div>
        </div>
      )}

      {/* Estado badges */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${estadoColor}`}>
          {estado === 'activo' ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
          {estado === 'bloqueado' ? 'Bloqueado' : estado === 'activo' ? 'Activo' : 'Inactivo'}
        </span>

        {cliente.tiene_credito && (
          <span className="flex items-center gap-1 rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800">
            <DollarSign className="h-3 w-3" />
            Con crédito
          </span>
        )}
      </div>

      {/* Fecha de creación */}
      <div className="mt-3 text-xs text-gray-500">
        Creado: {new Date(cliente.created_at).toLocaleDateString('es-ES')}
      </div>
    </div>
  )
}

import { Mail, Shield, CheckCircle, XCircle, Edit2, UserX, UserCheck } from 'lucide-react'
import { Button } from 'components/ui/Button'
import { type Usuario } from '../../services/usuariosApi'

const ROLE_COLORS: Record<string, string> = {
  Supervisor: 'bg-purple-100 text-purple-800',
  Vendedor: 'bg-blue-100 text-blue-800',
  Bodeguero: 'bg-green-100 text-green-800',
  Transportista: 'bg-orange-100 text-orange-800',
}

interface UsuarioCardProps {
  usuario: Usuario
  onEdit: (usuario: Usuario) => void
  onDeactivate: (usuario: Usuario) => void
  onActivate: (usuario: Usuario) => void
}

export function UsuarioCard({ usuario, onEdit, onDeactivate, onActivate }: UsuarioCardProps) {
  const roleColor = ROLE_COLORS[usuario.rol.nombre] || 'bg-gray-100 text-gray-800'

  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md min-h-[340px]">
      {/* Avatar y encabezado */}
      <div className="mb-4 flex items-center gap-4">
        {usuario.avatarUrl ? (
          <img
            src={usuario.avatarUrl}
            alt={usuario.nombre}
            className="h-12 w-12 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-brand-red/20 to-brand-red/40">
              <span className="text-lg font-bold text-brand-red">
                {(usuario.nombre && usuario.nombre.charAt(0).toUpperCase()) || (usuario.email && usuario.email.charAt(0).toUpperCase()) || '?'}
              </span>
          </div>
        )}
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900">{usuario.nombreCompleto || usuario.nombre || '?'}</h3>
          <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${roleColor}`}>
            {usuario.rol.nombre}
          </span>
        </div>
      </div>

      {/* Información de contacto y badges */}
      <div className="flex-1 flex flex-col justify-start">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Mail className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{usuario.email}</span>
          </div>

          {usuario.telefono && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Shield className="h-4 w-4 flex-shrink-0" />
              <span>{usuario.telefono}</span>
            </div>
          )}
        </div>

        {/* Badges de estado */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span
            className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${
              usuario.activo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
            }`}
          >
            {usuario.activo ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
            {usuario.activo ? 'Activo' : 'Inactivo'}
          </span>

          {usuario.emailVerificado && (
            <span className="flex items-center gap-1 rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800">
              <CheckCircle className="h-3 w-3" />
              Verificado
            </span>
          )}
        </div>

        {/* Fecha de creación */}
        <div className="mt-3 text-xs text-gray-500">
          Creado: {new Date(usuario.createdAt).toLocaleDateString('es-ES')}
        </div>
      </div>

      {/* Acciones */}
      <div className="mt-4 flex gap-2 border-t pt-4">
        <Button
          onClick={() => onEdit(usuario)}
          className="flex flex-1 items-center justify-center gap-2 bg-blue-600 text-white hover:bg-blue-700"
        >
          <Edit2 className="h-4 w-4" />
          Editar
        </Button>
        {usuario.activo ? (
          <Button
            onClick={() => onDeactivate(usuario)}
            className="flex flex-1 items-center justify-center gap-2 bg-orange-600 text-white hover:bg-orange-700"
          >
            <UserX className="h-4 w-4" />
            Desactivar
          </Button>
        ) : (
          <Button
            onClick={() => onActivate(usuario)}
            className="flex flex-1 items-center justify-center gap-2 bg-green-600 text-white hover:bg-green-700"
          >
            <UserCheck className="h-4 w-4" />
            Activar
          </Button>
        )}
      </div>
    </div>
  )
}

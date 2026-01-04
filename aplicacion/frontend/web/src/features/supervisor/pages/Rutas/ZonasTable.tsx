import { Edit2, Power } from 'lucide-react'
import { type ZonaComercial } from '../../services/zonasApi'

interface ZonasTableProps {
  zonas: ZonaComercial[]
  onEdit: (zona: ZonaComercial) => void
  onToggleEstado: (zona: ZonaComercial) => void
}

export function ZonasTable({ zonas, onEdit, onToggleEstado }: ZonasTableProps) {
  const handleToggle = (zona: ZonaComercial) => {
    const accion = zona.activo ? 'desactivar' : 'activar'
    if (confirm(`¿Estás seguro de ${accion} la zona "${zona.nombre}"?`)) {
      onToggleEstado(zona)
    }
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
      <table className="w-full">
        <thead className="border-b border-gray-200 bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Código</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Nombre</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Ciudad</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Macrorregión</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Vendedor</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Estado</th>
            <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {zonas.map((zona) => (
            <tr key={zona.id} className="transition-colors hover:bg-gray-50">
              <td className="px-6 py-4 text-sm font-semibold text-gray-900">{zona.codigo}</td>
              <td className="px-6 py-4 text-sm text-gray-800">{zona.nombre}</td>
              <td className="px-6 py-4 text-sm text-gray-700">{zona.ciudad || '—'}</td>
              <td className="px-6 py-4 text-sm text-gray-700">{zona.macrorregion || '—'}</td>
              <td className="px-6 py-4 text-sm text-gray-700">
                {zona.vendedor_asignado?.nombre_vendedor_cache || '—'}
              </td>
              <td className="px-6 py-4 text-sm">
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                    zona.activo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {zona.activo ? 'Activa' : 'Inactiva'}
                </span>
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => onEdit(zona)}
                    className="rounded-lg p-2 text-blue-600 transition-colors hover:bg-blue-50"
                    title="Editar"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleToggle(zona)}
                    className={`rounded-lg p-2 transition-colors ${
                      zona.activo
                        ? 'text-gray-600 hover:bg-gray-50'
                        : 'text-green-600 hover:bg-green-50'
                    }`}
                    title={zona.activo ? 'Desactivar' : 'Activar'}
                  >
                    <Power className="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

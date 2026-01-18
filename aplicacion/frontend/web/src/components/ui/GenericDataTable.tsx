import { Package } from 'lucide-react'

export interface GenericTableColumn<T> {
  key: keyof T
  label: string
  render?: (value: any, row: T) => React.ReactNode
  className?: string
}

export interface GenericTableProps<T> {
  data: T[]
  columns: GenericTableColumn<T>[]
  onEdit?: (item: T) => void
  onDelete?: (item: T) => void
  showActions?: boolean
  emptyStateTitle?: string
  emptyStateDescription?: string
  emptyStateIcon?: React.ReactNode
  loading?: boolean
}

export function GenericDataTable<T extends { id: string | number }>({
  data,
  columns,
  onEdit,
  onDelete,
  showActions = true,
  emptyStateTitle = 'Sin datos',
  emptyStateDescription = 'No hay registros para mostrar',
  emptyStateIcon = <Package className="h-8 w-8 text-gray-400" />,
  loading = false,
}: GenericTableProps<T>) {
  if (loading) {
    return (
      <div className="flex w-full items-center justify-center rounded-lg border border-gray-200 bg-white py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-brand-red" />
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
          {emptyStateIcon}
        </div>
        <h3 className="mt-4 text-lg font-semibold text-gray-900">{emptyStateTitle}</h3>
        <p className="mt-2 text-sm text-gray-600">{emptyStateDescription}</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
      <table className="w-full">
        <thead className="border-b border-gray-200 bg-gray-50">
          <tr>
            {columns.map((col) => (
              <th
                key={String(col.key)}
                className="px-6 py-3 text-left text-sm font-semibold text-gray-900"
              >
                {col.label}
              </th>
            ))}
            {showActions && (onEdit || onDelete) && (
              <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                Acciones
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {data.map((row) => (
            <tr key={row.id} className="hover:bg-gray-50 transition-colors">
              {columns.map((col) => (
                <td
                  key={String(col.key)}
                  className={`px-6 py-4 text-sm text-gray-700 ${col.className || ''}`}
                >
                  {col.render ? col.render(row[col.key], row) : String(row[col.key] || '—')}
                </td>
              ))}
              {showActions && (onEdit || onDelete) && (
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    {onEdit && (
                      <button
                        onClick={() => onEdit(row)}
                        className="rounded-lg p-2 text-blue-600 transition-colors hover:bg-blue-50"
                        title="Editar"
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => {
                          if (confirm('¿Estás seguro de eliminar este registro?')) {
                            onDelete(row)
                          }
                        }}
                        className="rounded-lg p-2 text-red-600 transition-colors hover:bg-red-50"
                        title="Eliminar"
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

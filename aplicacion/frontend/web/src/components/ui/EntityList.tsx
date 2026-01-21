interface EntityListItem {
  id: string | number
  [key: string]: any
}

interface EntityListProps<T extends EntityListItem> {
  items: T[]
  renderItem: (item: T) => React.ReactNode
  onEdit?: (item: T) => void
  onDelete?: (item: T) => void
  emptyMessage?: string
  showActions?: boolean
}

export function EntityList<T extends EntityListItem>({
  items,
  renderItem,
  onEdit,
  onDelete,
  emptyMessage = 'No hay elementos',
  showActions = true,
}: EntityListProps<T>) {
  if (items.length === 0) {
    return <p className="text-sm text-gray-500 text-center py-4">{emptyMessage}</p>
  }

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
        >
          <div className="flex-1">{renderItem(item)}</div>
          {showActions && (onEdit || onDelete) && (
            <div className="flex gap-2">
              {onEdit && (
                <button
                  onClick={() => onEdit(item)}
                  className="rounded-lg p-2 text-blue-600 transition-colors hover:bg-blue-50"
                  title="Editar"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  onClick={() => onDelete(item)}
                  className="rounded-lg p-2 text-red-600 transition-colors hover:bg-red-50"
                  title="Eliminar"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          )}
        </div>
      ))}
    </div>
  )
}

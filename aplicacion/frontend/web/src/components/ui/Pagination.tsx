import React from 'react'

type PaginationProps = {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  color?: string
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  color = '#F0412D',
}: PaginationProps) {
  if (totalPages <= 1) return null

  return (
    <div className="mt-6 flex justify-center gap-2">
      {Array.from({ length: totalPages }).map((_, i) => (
        <button
          key={i + 1}
          onClick={() => onPageChange(i + 1)}
          className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            currentPage === i + 1 ? 'text-white' : 'text-gray-600 hover:bg-gray-100'
          }`}
          style={currentPage === i + 1 ? { backgroundColor: color } : {}}
        >
          {i + 1}
        </button>
      ))}
    </div>
  )
}

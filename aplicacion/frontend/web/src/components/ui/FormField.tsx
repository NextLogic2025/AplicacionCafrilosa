import React from 'react'

type FormFieldProps = {
  label: string
  type?: 'text' | 'email' | 'password' | 'select' | 'textarea'
  value: string
  onChange: (value: string) => void
  placeholder?: string
  error?: string
  options?: { label: string; value: string }[]
  rows?: number
}

export function FormField({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  options,
  rows = 3,
}: FormFieldProps) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      {type === 'textarea' ? (
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className={`w-full rounded-lg border ${error ? 'border-red-500' : 'border-gray-300'} px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-red-500`}
        />
      ) : type === 'select' ? (
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className={`w-full rounded-lg border ${error ? 'border-red-500' : 'border-gray-300'} px-3 py-2 focus:ring-2 focus:ring-red-500`}
        >
          <option value="">Selecciona una opción</option>
          {options?.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full rounded-lg border ${error ? 'border-red-500' : 'border-gray-300'} px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-red-500`}
        />
      )}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}

import { TextField } from './TextField'

export type ClienteFormValues = {
  contacto_nombre: string
  contacto_email: string
  contacto_password: string
  identificacion: string
  tipo_identificacion: string
  razon_social: string
  nombre_comercial: string
  tiene_credito: boolean
  limite_credito: number
  dias_plazo: number
  direccion_texto: string
  lista_precios_id: number | null
  zona_comercial_id: number | null
}

export type ZonaOption = { id: number; nombre: string; descripcion?: string }
export type ListaPrecioOption = { id: number; nombre: string; descripcion?: string; activo?: boolean }

export const TIPOS_IDENTIFICACION = ['RUC', 'Cédula', 'Pasaporte']

export const CLIENTE_FORM_DEFAULT: ClienteFormValues = {
  contacto_nombre: '',
  contacto_email: '',
  contacto_password: '',
  identificacion: '',
  tipo_identificacion: 'RUC',
  razon_social: '',
  nombre_comercial: '',
  tiene_credito: false,
  limite_credito: 0,
  dias_plazo: 0,
  direccion_texto: '',
  lista_precios_id: null,
  zona_comercial_id: null,
}

export function validateClienteForm(value: ClienteFormValues, mode: 'create' | 'edit'): Record<string, string> {
  const newErrors: Record<string, string> = {}

  // Solo validar datos de acceso en modo crear
  if (mode === 'create') {
    if (!value.contacto_nombre.trim()) {
      newErrors.contacto_nombre = 'El nombre del contacto es requerido'
    }

    if (!value.contacto_email.trim()) {
      newErrors.contacto_email = 'El email del contacto es requerido'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.contacto_email)) {
      newErrors.contacto_email = 'Email inválido'
    }

    if (!value.contacto_password) {
      newErrors.contacto_password = 'La contraseña es requerida'
    } else if (value.contacto_password.length < 6) {
      newErrors.contacto_password = 'La contraseña debe tener al menos 6 caracteres'
    }
  }

  if (!value.identificacion.trim()) {
    newErrors.identificacion = 'La identificación es requerida'
  }

  if (!value.razon_social.trim()) {
    newErrors.razon_social = 'La razón social es requerida'
  }

  if (value.tiene_credito && value.limite_credito <= 0) {
    newErrors.limite_credito = 'El límite de crédito debe ser mayor a 0'
  }

  if (value.tiene_credito && value.dias_plazo < 0) {
    newErrors.dias_plazo = 'Los días de plazo no pueden ser negativos'
  }

  return newErrors
}

interface ClienteFormProps {
  value: ClienteFormValues
  errors: Record<string, string>
  mode: 'create' | 'edit'
  isSubmitting: boolean
  isCatalogLoading: boolean
  zonas: ZonaOption[]
  listasPrecios: ListaPrecioOption[]
  onChange: (next: ClienteFormValues) => void
}

export function ClienteForm({
  value,
  errors,
  mode,
  isSubmitting,
  isCatalogLoading,
  zonas,
  listasPrecios,
  onChange,
}: ClienteFormProps) {
  const update = <K extends keyof ClienteFormValues>(key: K, val: ClienteFormValues[K]) => {
    onChange({ ...value, [key]: val })
  }

  const listaChips = listasPrecios.length > 0 ? listasPrecios : [{ id: 0, nombre: 'General' }]

  return (
    <>
      {/* Datos de Acceso - Solo en modo crear */}
      {mode === 'create' && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-4">
          <p className="text-sm font-semibold text-gray-800">Datos de Acceso</p>
          <div className="grid gap-4 md:grid-cols-2">
            <TextField
              label="Nombre del contacto"
              tone="light"
              type="text"
              placeholder="Ej: Juan Pérez"
              value={value.contacto_nombre}
              onChange={(e) => update('contacto_nombre', e.target.value)}
              error={errors.contacto_nombre}
              disabled={isSubmitting}
            />

            <TextField
              label="Correo del contacto"
              tone="light"
              type="email"
              placeholder="contacto@cliente.com"
              value={value.contacto_email}
              onChange={(e) => update('contacto_email', e.target.value)}
              error={errors.contacto_email}
              disabled={isSubmitting}
            />
          </div>

          <TextField
            label="Contraseña"
            tone="light"
            type="password"
            placeholder="Mínimo 6 caracteres"
            value={value.contacto_password}
            onChange={(e) => update('contacto_password', e.target.value)}
            error={errors.contacto_password}
            disabled={isSubmitting}
          />
        </div>
      )}

      {/* Información Comercial */}
      <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-4">
        <p className="text-sm font-semibold text-gray-800">Información Comercial</p>

        <TextField
          label="Razón Social"
          tone="light"
          type="text"
          placeholder="Ej. Empresa S.A."
          value={value.razon_social}
          onChange={(e) => update('razon_social', e.target.value)}
          error={errors.razon_social}
          disabled={isSubmitting}
        />

        <TextField
          label="Nombre Comercial"
          tone="light"
          type="text"
          placeholder="Ej. Tienda El Chavo"
          value={value.nombre_comercial}
          onChange={(e) => update('nombre_comercial', e.target.value)}
          disabled={isSubmitting}
        />

        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <label className="text-xs text-neutral-600">Tipo de Identificación</label>
            <select
              value={value.tipo_identificacion}
              onChange={(e) => update('tipo_identificacion', e.target.value)}
              className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-neutral-900 outline-none transition focus:border-brand-red/60 focus:shadow-[0_0_0_4px_rgba(240,65,45,0.18)] disabled:opacity-50"
              disabled={isSubmitting}
            >
              {TIPOS_IDENTIFICACION.map((tipo) => (
                <option key={tipo} value={tipo}>
                  {tipo}
                </option>
              ))}
            </select>
          </div>

          <TextField
            label="Identificación (RUC/Cédula)"
            tone="light"
            type="text"
            placeholder="Ej. 177777777001"
            value={value.identificacion}
            onChange={(e) => update('identificacion', e.target.value)}
            error={errors.identificacion}
            disabled={isSubmitting}
          />
        </div>

        <TextField
          label="Dirección Matriz"
          tone="light"
          type="text"
          placeholder="Ej. Av. Principal 123"
          value={value.direccion_texto}
          onChange={(e) => update('direccion_texto', e.target.value)}
          disabled={isSubmitting}
        />
      </div>

      {/* Configuración */}
      <div className="space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
        <p className="text-sm font-semibold text-gray-800">Configuración</p>

        <div className="grid gap-2">
          <label className="text-xs text-neutral-600">Zona</label>
          <select
            value={value.zona_comercial_id ?? ''}
            onChange={(e) => update('zona_comercial_id', e.target.value ? Number(e.target.value) : null)}
            className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-neutral-900 outline-none transition focus:border-brand-red/60 focus:shadow-[0_0_0_4px_rgba(240,65,45,0.18)] disabled:opacity-50"
            disabled={isSubmitting || isCatalogLoading}
          >
            <option value="">Seleccionar zona</option>
            {zonas.map((z) => (
              <option key={z.id} value={z.id}>
                {z.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-2">
          <label className="text-xs text-neutral-600">Lista de Precios Asignada</label>
          <div className="flex flex-wrap gap-2">
            {listaChips.map((lista) => {
              const selected = value.lista_precios_id === lista.id || (lista.id === 0 && value.lista_precios_id === null)
              return (
                <button
                  type="button"
                  key={lista.id}
                  onClick={() => update('lista_precios_id', lista.id === 0 ? null : lista.id)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    selected ? 'bg-brand-red text-white shadow' : 'bg-white text-neutral-700 hover:bg-neutral-100'
                  }`}
                  disabled={isSubmitting || isCatalogLoading}
                >
                  {lista.nombre}
                </button>
              )
            })}
          </div>
        </div>

        <div className="space-y-3 rounded-lg border border-dashed border-neutral-200 bg-white p-3">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="tiene_credito"
              checked={value.tiene_credito}
              onChange={(e) => update('tiene_credito', e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-brand-red focus:ring-brand-red"
              disabled={isSubmitting}
            />
            <label htmlFor="tiene_credito" className="text-sm font-medium text-neutral-700">
              Tiene Crédito
            </label>
          </div>

          {value.tiene_credito && (
            <div className="grid gap-4 md:grid-cols-2">
              <TextField
                label="Límite de Crédito"
                tone="light"
                type="number"
                placeholder="0.00"
                value={value.limite_credito}
                onChange={(e) => update('limite_credito', parseFloat(e.target.value) || 0)}
                error={errors.limite_credito}
                disabled={isSubmitting}
              />

              <TextField
                label="Días de Plazo"
                tone="light"
                type="number"
                placeholder="30"
                value={value.dias_plazo}
                onChange={(e) => update('dias_plazo', parseInt(e.target.value) || 0)}
                error={errors.dias_plazo}
                disabled={isSubmitting}
              />
            </div>
          )}
        </div>
      </div>
    </>
  )
}
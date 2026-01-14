import { useState, useEffect } from 'react'
import { Send, Plus, MessageCircle, LifeBuoy } from 'lucide-react'
import { useCliente } from '../../hooks/useCliente'
import { LoadingSpinner } from 'components/ui/LoadingSpinner'
import { Alert } from 'components/ui/Alert'
import { SectionHeader } from 'components/ui/SectionHeader'
import { StatCard } from 'components/ui/StatCard'
import { PageHero } from 'components/ui/PageHero'
import { ticketStatusConfig, ticketPriorityConfig } from 'utils/statusHelpers'
import { EstadoTicket, Ticket, PrioridadTicket } from '../../types'

interface FormularioTicket {
  title: string
  description: string
  category: string
  priority: PrioridadTicket
}

export default function PaginaSoporte() {
  const { tickets, fetchTickets, crearTicket, error } = useCliente()
  const [cargando, setCargando] = useState(true)
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [ticketSeleccionado, setTicketSeleccionado] = useState<Ticket | null>(null)
  const [mensajeNuevo, setMensajeNuevo] = useState('')
  const [formulario, setFormulario] = useState<FormularioTicket>({ title: '', description: '', category: 'general', priority: 'medium' })

  useEffect(() => {
    const cargar = async () => {
      setCargando(true)
      await fetchTickets()
      setCargando(false)
    }
    cargar()
  }, [fetchTickets])

  const enviarTicket = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formulario.title.trim() || !formulario.description.trim()) {
      alert('Por favor completa todos los campos')
      return
    }

    crearTicket({
      title: formulario.title,
      description: formulario.description,
      category: formulario.category,
      priority: formulario.priority,
      status: EstadoTicket.OPEN,
      customerId: 'cust-1',
    } as Ticket)

    alert('Ticket creado correctamente (mock)')
    setFormulario({ title: '', description: '', category: 'general', priority: 'medium' })
    setMostrarFormulario(false)
  }

  const enviarMensaje = () => {
    if (!mensajeNuevo.trim() || !ticketSeleccionado) return
    console.log('Mensaje enviado (mock):', mensajeNuevo)
    setMensajeNuevo('')
    alert('Mensaje enviado (mock)')
  }

  return (
    <div className="space-y-6">
      <PageHero
        title="Centro de Soporte"
        subtitle="Obtén ayuda con tus dudas, reporta problemas y accede a nuestra base de conocimiento"
        chips={[
          'Chat con soporte',
          'Tickets de soporte',
          'Preguntas frecuentes',
        ]}
      />

      {error && <Alert type="error" title="Error" message={error} />}

      <SectionHeader
        title="Soporte Técnico"
        subtitle="Crear y gestionar solicitudes de soporte"
        rightSlot={
          <button
            onClick={() => setMostrarFormulario(true)}
            className="flex items-center gap-2 rounded-lg bg-brand-red px-4 py-2 text-white transition hover:bg-brand-red700"
          >
            <Plus size={20} />
            Nuevo Ticket
          </button>
        }
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Abiertos" value={tickets.filter(t => t.status === EstadoTicket.OPEN).length} color="blue" />
        <StatCard label="En proceso" value={tickets.filter(t => t.status === EstadoTicket.IN_PROGRESS).length} color="yellow" />
        <StatCard label="Resueltos" value={tickets.filter(t => t.status === EstadoTicket.RESOLVED).length} color="emerald" />
        <StatCard label="Total" value={tickets.length} color="purple" />
      </div>

      {cargando ? (
        <LoadingSpinner />
      ) : (
        <div className="space-y-3">
          {tickets.length > 0 ? (
            tickets.map(ticket => (
              <div
                key={ticket.id}
                onClick={() => setTicketSeleccionado(ticket)}
                className="cursor-pointer rounded-lg border border-gray-200 bg-white p-4 transition hover:shadow-md"
              >
                <div className="mb-2 flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{ticket.title}</h3>
                    <p className="mt-1 text-sm text-gray-600">{ticket.description}</p>
                  </div>
                  <span className={`rounded px-2 py-1 text-xs font-semibold ${ticketStatusConfig[ticket.status].color}`}>
                    {ticketStatusConfig[ticket.status].label}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <span className={`rounded px-2 py-1 ${ticketPriorityConfig[ticket.priority].bg} ${ticketPriorityConfig[ticket.priority].color}`}>
                    Prioridad {ticketPriorityConfig[ticket.priority].label}
                  </span>
                  <span>ID: {ticket.id}</span>
                  <span>{new Date(ticket.createdAt).toLocaleDateString('es-ES')}</span>
                  {ticket.messages && ticket.messages.length > 0 && (
                    <span className="flex items-center gap-1">
                      <MessageCircle size={14} />
                      {ticket.messages.length} mensajes
                    </span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="py-8 text-center text-gray-600">
              <MessageCircle size={48} className="mx-auto mb-3 opacity-50" />
              <p>No tienes tickets de soporte</p>
              <button
                onClick={() => setMostrarFormulario(true)}
                className="mt-4 font-medium text-brand-red transition hover:opacity-80"
              >
                Crear tu primer ticket
              </button>
            </div>
          )}
        </div>
      )}

      {mostrarFormulario && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg bg-white">
            <div className="sticky top-0 flex items-center justify-between bg-gradient-to-r from-brand-red to-brand-red700 p-6 text-white">
              <h2 className="text-xl font-bold">Nuevo Ticket de Soporte</h2>
              <button onClick={() => setMostrarFormulario(false)} className="text-2xl text-white hover:text-red-100">
                ×
              </button>
            </div>

            <form onSubmit={enviarTicket} className="space-y-4 p-6">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Título del Problema</label>
                <input
                  type="text"
                  value={formulario.title}
                  onChange={e => setFormulario({ ...formulario, title: e.target.value })}
                  placeholder="Resumen de tu problema"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Categoría</label>
                <select
                  value={formulario.category}
                  onChange={e => setFormulario({ ...formulario, category: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-red-500"
                >
                  <option value="general">General</option>
                  <option value="billing">Facturación</option>
                  <option value="delivery">Entrega</option>
                  <option value="product">Productos</option>
                  <option value="technical">Técnico</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Prioridad</label>
                <select
                  value={formulario.priority}
                  onChange={e => setFormulario({ ...formulario, priority: e.target.value as PrioridadTicket })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-red-500"
                >
                  <option value="low">Baja</option>
                  <option value="medium">Media</option>
                  <option value="high">Alta</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Descripción Detallada</label>
                <textarea
                  value={formulario.description}
                  onChange={e => setFormulario({ ...formulario, description: e.target.value })}
                  placeholder="Cuéntanos más detalles sobre tu problema..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-red-500"
                  rows={5}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setMostrarFormulario(false)}
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-2 transition hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button type="submit" className="flex-1 rounded-lg bg-brand-red px-4 py-2 text-white transition hover:bg-brand-red700">
                  Crear Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {ticketSeleccionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white">
            <div className="sticky top-0 flex items-center justify-between bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
              <div>
                <h2 className="text-xl font-bold">{ticketSeleccionado.title}</h2>
                <p className="mt-1 text-sm text-blue-100">{ticketSeleccionado.id}</p>
              </div>
              <button onClick={() => setTicketSeleccionado(null)} className="text-2xl text-white hover:text-blue-100">
                ×
              </button>
            </div>

            <div className="space-y-6 p-6">
              <div className="grid grid-cols-2 gap-4 border-b border-gray-200 pb-4">
                <div>
                  <p className="text-sm text-gray-600">Estado</p>
                  <p className={`font-semibold ${ticketStatusConfig[ticketSeleccionado.status].color}`}>
                    {ticketStatusConfig[ticketSeleccionado.status].label}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Prioridad</p>
                  <p className={`font-semibold ${ticketPriorityConfig[ticketSeleccionado.priority].color}`}>
                    {ticketPriorityConfig[ticketSeleccionado.priority].label}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Categoría</p>
                  <p className="font-semibold capitalize">{ticketSeleccionado.category}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Creado</p>
                  <p className="font-semibold">
                    {new Date(ticketSeleccionado.createdAt).toLocaleDateString('es-ES')}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="mb-2 font-semibold text-gray-900">Descripción</h3>
                <p className="text-gray-700">{ticketSeleccionado.description}</p>
              </div>

              <div>
                <h3 className="mb-3 font-semibold text-gray-900">Mensajes</h3>
                <div className="max-h-48 space-y-3 overflow-y-auto rounded-lg bg-gray-50 p-4">
                  {ticketSeleccionado.messages && ticketSeleccionado.messages.length > 0 ? (
                    ticketSeleccionado.messages.map(msg => (
                      <div key={msg.id} className={`rounded-lg p-3 ${msg.isCustomer ? 'bg-white' : 'bg-blue-50'}`}>
                        <div className="mb-1 flex items-center justify-between text-xs text-gray-600">
                          <span className="font-semibold text-gray-800">{msg.senderName}</span>
                          <span>{new Date(msg.sentAt).toLocaleString('es-ES')}</span>
                        </div>
                        <p className="text-sm text-gray-800">{msg.message}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-600">No hay mensajes aún.</p>
                  )}
                </div>

                <div className="mt-3 flex gap-2">
                  <input
                    type="text"
                    value={mensajeNuevo}
                    onChange={e => setMensajeNuevo(e.target.value)}
                    placeholder="Escribe un mensaje..."
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={enviarMensaje}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

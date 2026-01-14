import React, { useEffect, useState } from 'react'
import { Send, Phone, Search, Mail } from 'lucide-react'
import { useCliente } from '../../hooks/useCliente'
import { LoadingSpinner } from 'components/ui/LoadingSpinner'
import { Alert } from 'components/ui/Alert'
import { SectionHeader } from 'components/ui/SectionHeader'
import { MessageBubble } from 'components/ui/MessageBubble'
import { PageHero } from 'components/ui/PageHero'
import { COLORES_MARCA, Conversacion, Mensaje } from '../../types'
import { servicioMensajes } from '../../services/mensajes'

export default function PaginaMensajes() {
  const { conversaciones, unreadMessageCount, cargando, error, fetchConversaciones, limpiarError } = useCliente()

  const [conversacionSeleccionada, setConversacionSeleccionada] = useState<Conversacion | null>(null)
  const [mensajesConversacion, setMensajesConversacion] = useState<Mensaje[]>([])
  const [mensajeNuevo, setMensajeNuevo] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [cargandoMensajes, setCargandoMensajes] = useState(false)

  useEffect(() => {
    fetchConversaciones()
  }, [fetchConversaciones])

  useEffect(() => {
    if (conversacionSeleccionada) {
      cargarMensajes(conversacionSeleccionada.id)
    }
  }, [conversacionSeleccionada])

  const cargarMensajes = async (idConversacion: string) => {
    setCargandoMensajes(true)
    try {
      const response = await servicioMensajes.getMessages(idConversacion)
      if (response.success && response.data) {
        setMensajesConversacion(response.data.data)
        await servicioMensajes.markAsRead(idConversacion)
      }
    } catch (err) {
      console.error('Error loading messages:', err)
    } finally {
      setCargandoMensajes(false)
    }
  }

  const enviarMensaje = async () => {
    if (!mensajeNuevo.trim() || !conversacionSeleccionada) return

    try {
      const response = await servicioMensajes.sendMessage(conversacionSeleccionada.id, mensajeNuevo)
      if (response.success) {
        setMensajeNuevo('')
        await cargarMensajes(conversacionSeleccionada.id)
      }
    } catch (err) {
      console.error('Error sending message:', err)
    }
  }

  const conversacionesFiltradas = conversaciones.filter(conv =>
    conv.vendorName.toLowerCase().includes(busqueda.toLowerCase()),
  )

  return (
    <>
      <PageHero
        title="Mensajes"
        subtitle="Comunicación directa con nuestro equipo de atención al cliente"
        chips={[
          'Chats activos',
          'Historial de mensajes',
          'Soporte dedicado',
        ]}
      />

      <div className="space-y-6 p-4 md:p-8">
        <div className="mx-auto w-full max-w-6xl">
          {error && <Alert type="error" title="Error" message={error} onClose={limpiarError} />}

        <SectionHeader title="Mensajes" subtitle="Comunícate directamente con tu vendedor" />

        <div className="flex h-[calc(100vh-120px)] flex-col gap-4 overflow-hidden rounded-lg border border-gray-200 bg-white">
          <div className="hidden w-80 flex-col border-r border-gray-200 md:flex">
            <div className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar vendedor..."
                  value={busqueda}
                  onChange={e => setBusqueda(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-brand-red"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {cargando ? (
                <div className="p-4">
                  <LoadingSpinner size="sm" text="Cargando..." />
                </div>
              ) : conversacionesFiltradas.length === 0 ? (
                <div className="p-4 text-center text-gray-600">No hay conversaciones</div>
              ) : (
                conversacionesFiltradas.map(conv => (
                  <button
                    key={conv.id}
                    onClick={() => setConversacionSeleccionada(conv)}
                    className={`w-full border-b border-gray-100 px-4 py-3 text-left transition-colors hover:bg-gray-50 ${
                      conversacionSeleccionada?.id === conv.id ? 'bg-red-50' : ''
                    }`}
                    style={
                      conversacionSeleccionada?.id === conv.id ? { backgroundColor: `${COLORES_MARCA.red}15` } : {}
                    }
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{conv.vendorName}</p>
                        <p className="truncate text-sm text-gray-600">{conv.lastMessage || 'No hay mensajes'}</p>
                      </div>
                      {conv.unreadCount > 0 && (
                        <span
                          className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold text-white"
                          style={{ backgroundColor: COLORES_MARCA.red }}
                        >
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {conversacionSeleccionada ? (
            <div className="flex flex-1 flex-col">
              <div className="flex items-center justify-between border-b border-gray-200 p-4" style={{ backgroundColor: `${COLORES_MARCA.red}10` }}>
                <div>
                  <h2 className="font-semibold text-gray-900">{conversacionSeleccionada.vendorName}</h2>
                  <p className="text-sm text-gray-600">Vendedor</p>
                </div>
                <button className="p-2 text-gray-600 transition-colors hover:text-gray-900">
                  <Phone className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto p-4">
                {cargandoMensajes ? (
                  <LoadingSpinner size="sm" />
                ) : mensajesConversacion.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-gray-500">
                    No hay mensajes aún. ¡Inicia la conversación!
                  </div>
                ) : (
                  mensajesConversacion.map(msg => <MessageBubble key={msg.id} message={msg} isOwn={false} />)
                )}
              </div>

              <div className="border-t border-gray-200 p-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={mensajeNuevo}
                    onChange={e => setMensajeNuevo(e.target.value)}
                    onKeyPress={e => {
                      if (e.key === 'Enter') enviarMensaje()
                    }}
                    placeholder="Escribe tu mensaje..."
                    className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2"
                  />
                  <button
                    onClick={enviarMensaje}
                    disabled={!mensajeNuevo.trim()}
                    className="rounded-lg px-4 py-2 font-semibold text-white transition-colors disabled:opacity-50"
                    style={{ backgroundColor: COLORES_MARCA.red }}
                  >
                    <Send className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="hidden flex-1 items-center justify-center md:flex">
              <div className="text-center text-gray-600">
                <p className="mb-2 text-lg">Selecciona una conversación</p>
                <p className="text-sm">para comenzar a escribir</p>
              </div>
            </div>
          )}
        </div>
        </div>
      </div>
    </>
  )
}

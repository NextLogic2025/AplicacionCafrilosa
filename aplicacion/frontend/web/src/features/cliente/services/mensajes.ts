import { Mensaje } from '../types'

const MENSAJES_MOCK: Mensaje[] = [
  { id: 'msg-1', content: 'Hola, ¿cómo estás?', createdAt: new Date().toISOString() },
  { id: 'msg-2', content: 'Recibimos tu pedido.', createdAt: new Date().toISOString() },
]

export const servicioMensajes = {
  async getMessages(_conversationId: string) {
    return {
      success: true,
      data: { data: MENSAJES_MOCK },
    }
  },
  async markAsRead(_conversationId: string) {
    return { success: true }
  },
  async sendMessage(_conversationId: string, content: string) {
    MENSAJES_MOCK.push({ id: `msg-${MENSAJES_MOCK.length + 1}`, content, createdAt: new Date().toISOString(), isOwn: true })
    return { success: true }
  },
}

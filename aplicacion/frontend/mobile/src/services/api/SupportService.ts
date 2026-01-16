import { delay } from '../../utils/delay'

export interface Ticket {
    id: string
    subject: string
    description: string
    status: 'open' | 'closed' | 'in_progress'
    date: string
    attachmentUrl?: string
}

export const SupportService = {
    async getTickets(): Promise<Ticket[]> {
        await delay(500)
        return []
    },

    async createTicket(_ticket: Omit<Ticket, 'id' | 'date' | 'status'>): Promise<boolean> {
        await delay(1000)
        return true
    }
}

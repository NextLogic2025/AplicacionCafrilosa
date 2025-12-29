import { delay } from '../../utils/delay'

export interface Invoice {
    id: string
    number: string
    issueDate: string // ISO Date
    dueDate: string // ISO Date
    total: number
    balance: number // Saldo pendiente
    status: 'paid' | 'pending' | 'overdue' // pagado, pendiente, vencido
    pdfUrl?: string
    itemsCount?: number
    clientName?: string // For Seller View
}

export const InvoiceService = {
    async getInvoices(): Promise<Invoice[]> {
        await delay(500)
        return []
    },

    async getInvoiceById(id: string): Promise<Invoice | null> {
        await delay(500)
        return null
    },

    async getInvoiceDetail(id: string): Promise<Invoice | undefined> {
        await delay(500)
        return undefined
    }
}

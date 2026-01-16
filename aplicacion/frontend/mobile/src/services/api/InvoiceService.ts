import { delay } from '../../utils/delay'

export interface Invoice {
    id: string
    number: string
    issueDate: string
    dueDate: string
    total: number
    balance: number
    status: 'paid' | 'pending' | 'overdue'
    pdfUrl?: string
    itemsCount?: number
    clientName?: string
}

export const InvoiceService = {
    async getInvoices(): Promise<Invoice[]> {
        await delay(500)
        return []
    },

    async getInvoiceById(_id: string): Promise<Invoice | null> {
        await delay(500)
        return null
    },

    async getInvoiceDetail(_id: string): Promise<Invoice | undefined> {
        await delay(500)
        return undefined
    }
}

import { apiRequest } from './client'
import { env } from '../../config/env'
import { endpoints } from './endpoints'
import { logErrorForDebugging } from '../../utils/errorMessages'

function financeEndpoint(path: string) {
    return `${env.api.financeUrl}${path}`
}

export interface InvoiceDetail {
    id: string
    factura_id: string
    producto_id: string
    descripcion: string
    cantidad: number
    precio_unitario: number
    total_linea: number
}

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
    rucCliente?: string
    detalles?: InvoiceDetail[]
}

// Mapeo simple de DTO a Entidad de UI
const mapInvoice = (dto: any): Invoice => {
    // Calcular estado basado en saldo
    // Si backend manda 'estado', usarlo, si no calcular por saldos
    let status: Invoice['status'] = 'pending'
    // Logica simple: si saldo es 0 -> paid
    // Si fecha vencimiento < hoy y saldo > 0 -> overdue

    // Backend `facturas` devuelve:
    // id, numero_completo, fecha_emision, total_final, url_pdf, cliente_id...
    // Backend `cuentas_por_cobrar` maneja saldos.

    // Vamos a asumir que el endpoint devuelve un mix o calcularemos
    // Por ahora mapeamos lo básico
    return {
        id: dto.id,
        number: dto.numero_completo || 'SIN-NUMERO',
        issueDate: dto.fecha_emision || new Date().toISOString(),
        dueDate: dto.fecha_vencimiento || dto.fecha_emision || new Date().toISOString(),
        total: Number(dto.total_final || 0),
        balance: Number(dto.saldo_pendiente ?? dto.total_final ?? 0), // Si no viene saldo, asumir todo pendiente
        status: (dto.saldo_pendiente <= 0) ? 'paid' : (new Date(dto.fecha_vencimiento) < new Date() ? 'overdue' : 'pending'),
        pdfUrl: dto.url_pdf,
        clientName: dto.razon_social_cliente,
        rucCliente: dto.ruc_cliente,
        itemsCount: dto.detalles?.length || 0,
        detalles: dto.detalles
    }
}

export const InvoiceService = {
    async getInvoices(filters?: any): Promise<Invoice[]> {
        // En un caso real el controller filtra por rol. 
        // Si soy Cliente, el backend me da SOLO las mias.
        // Si soy Supervisor, el backend me da TODAS.
        // No necesitamos lógica extra aquí más que pasar filtros si hubieran.
        try {
            const url = financeEndpoint(endpoints.finance.facturas)
            const data = await apiRequest<any[]>(url)
            return data.map(mapInvoice)
        } catch (error) {
            logErrorForDebugging(error, 'InvoiceService.getInvoices')
            // Fallback vacio para no romper UI
            return []
        }
    },

    async getInvoiceById(id: string): Promise<Invoice | null> {
        try {
            const url = financeEndpoint(endpoints.finance.facturaById(id))
            const data = await apiRequest<any>(url)
            return mapInvoice(data)
        } catch (error) {
            logErrorForDebugging(error, 'InvoiceService.getInvoiceById', { id })
            return null
        }
    }
}

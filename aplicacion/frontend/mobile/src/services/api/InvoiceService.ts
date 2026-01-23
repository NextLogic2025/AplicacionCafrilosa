import { ApiService } from './ApiService'
import { createService } from './createService'
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
    codigoPedido?: string
    pedidoId?: string
    vendedorNombre?: string
    estadoSri?: string
    subtotal?: number
    impuestos?: number
}

const mapInvoice = (dto: any): Invoice => {
    const saldoPendiente = Number(dto.saldo_pendiente ?? dto.total_final ?? 0)
    const fechaVencimiento = dto.fecha_vencimiento || dto.fecha_emision
    const estaVencida = fechaVencimiento && new Date(fechaVencimiento) < new Date()

    let status: Invoice['status'] = 'pending'
    if (saldoPendiente <= 0) {
        status = 'paid'
    } else if (estaVencida) {
        status = 'overdue'
    }

    return {
        id: dto.id,
        number: dto.numero_completo || 'SIN-NUMERO',
        issueDate: dto.fecha_emision || new Date().toISOString(),
        dueDate: fechaVencimiento || new Date().toISOString(),
        total: Number(dto.total_final || 0),
        balance: saldoPendiente,
        status,
        pdfUrl: dto.url_pdf,
        clientName: dto.razon_social_cliente,
        rucCliente: dto.ruc_cliente,
        itemsCount: dto.detalles?.length || dto.items_count || 0,
        detalles: dto.detalles,
        codigoPedido: dto.codigo_pedido || dto.pedido?.codigo_visual,
        pedidoId: dto.pedido_id,
        vendedorNombre: dto.vendedor_nombre || dto.vendedor?.nombre,
        estadoSri: dto.estado_sri,
        subtotal: Number(dto.subtotal || 0),
        impuestos: Number(dto.impuestos || 0)
    }
}

const rawService = {
    async getInvoices(filters?: any): Promise<Invoice[]> {
        try {
            const url = financeEndpoint(endpoints.finance.facturas)
            const data = await ApiService.get<any[]>(url)
            return data.map(mapInvoice)
        } catch (error) {
            logErrorForDebugging(error, 'InvoiceService.getInvoices', { filters })
            return []
        }
    },

    async getInvoiceById(id: string): Promise<Invoice | null> {
        try {
            const url = financeEndpoint(endpoints.finance.facturaById(id))
            const data = await ApiService.get<any>(url)
            return mapInvoice(data)
        } catch (error) {
            logErrorForDebugging(error, 'InvoiceService.getInvoiceById', { id })
            return null
        }
    }
}

export const InvoiceService = createService('InvoiceService', rawService)

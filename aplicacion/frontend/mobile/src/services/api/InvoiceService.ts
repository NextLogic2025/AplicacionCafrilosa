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
    // Nuevos campos para mejor visualización
    codigoPedido?: string        // Código visual del pedido relacionado
    pedidoId?: string            // ID del pedido para navegación
    vendedorNombre?: string      // Nombre del vendedor que realizó la venta
    estadoSri?: string           // Estado en el SRI (AUTORIZADO, PENDIENTE, RECHAZADO)
    subtotal?: number            // Subtotal sin impuestos
    impuestos?: number           // Total de impuestos
}

// Mapeo de DTO del backend a entidad de UI
const mapInvoice = (dto: any): Invoice => {
    // Calcular estado basado en saldo y fecha de vencimiento
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
        // Nuevos campos
        codigoPedido: dto.codigo_pedido || dto.pedido?.codigo_visual,
        pedidoId: dto.pedido_id,
        vendedorNombre: dto.vendedor_nombre || dto.vendedor?.nombre,
        estadoSri: dto.estado_sri,
        subtotal: Number(dto.subtotal || 0),
        impuestos: Number(dto.impuestos || 0)
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

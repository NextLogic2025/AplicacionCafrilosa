
import type { Cliente } from '../../../supervisor/services/clientesApi'
import type { Producto } from '../../../cliente/types'
export type { Producto }


export interface CartItem {
    producto: Producto
    cantidad: number
}

export interface SucursalCliente {
    id: string
    nombre_sucursal: string
    direccion_entrega?: string
    contacto_nombre?: string
    contacto_telefono?: string
    zona_nombre?: string
    // Alias para compatibilidad
    nombre?: string
    direccion?: string
    ciudad?: string
    estado?: string
}

export interface ClienteDetalle extends Omit<Cliente, 'limite_credito' | 'saldo_actual' | 'deuda_actual' | 'dias_plazo' | 'direccion_texto'> {
    creditLimit?: number
    currentDebt?: number
    limite_credito?: string | number
    saldo_actual?: string | number
    deuda_actual?: string | number
    dias_plazo?: number
    direccion?: string
    direccion_texto?: string
    ciudad?: string
    estado?: string
}

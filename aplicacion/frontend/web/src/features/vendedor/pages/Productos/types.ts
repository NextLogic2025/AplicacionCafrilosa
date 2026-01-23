
import type { Producto } from '../../../cliente/types'

export type { Producto }

export interface FiltrosState {
    category: string
    minPrice: number
    maxPrice: number
    inStock: boolean
}

export interface Category {
    id: number
    nombre: string
}

export interface CartItem {
    producto: Producto
    cantidad: number
}

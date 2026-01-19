import { delay } from '../../utils/delay'

export type ProductParams = {
    categoryId?: string
    search?: string
}

export type Category = {
    id: string
    name: string
    icon: string
}

export type Product = {
    id: string
    name: string
    description?: string
    price: number
    image?: string
    category: string
    code: string
    stock?: number
    reservedStock?: number
    location?: string
    unit?: string
    critical?: boolean
}

export interface Lot {
    id: string
    productId: string
    productName: string
    code: string
    expirationDate: string
    quantity: number
    status: 'active' | 'blocked' | 'expired'
}

export const ProductService = {
    async getProducts(_params?: ProductParams | string): Promise<Product[]> {
        await delay(500)
        return []
    },

    async getLots(): Promise<Lot[]> {
        await delay(500)
        return []
    },

    async blockLot(_id: string): Promise<boolean> {
        await delay(500)
        return true
    },

    async adjustInventory(_productId: string, _type: 'merma' | 'damage' | 'difference', _quantity: number, _notes?: string): Promise<boolean> {
        await delay(1000)
        return true
    },

    async getProductById(_id: string): Promise<Product | null> {
        await delay(300)
        return null
    },

    async getCategories(): Promise<Category[]> {
        return [
            { id: '1', name: 'Embutidos', icon: 'nutrition' },
            { id: '2', name: 'Carnes', icon: 'restaurant' },
            { id: '3', name: 'Lácteos', icon: 'water' },
            { id: '4', name: 'Snacks', icon: 'fast-food' },
        ]
    }
}

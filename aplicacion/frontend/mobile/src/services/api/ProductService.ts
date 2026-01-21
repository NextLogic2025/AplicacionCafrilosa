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
    async getProducts(params?: ProductParams & { clienteId?: string }): Promise<Product[]> {
        // Si se pasa clienteId, filtra productos por cliente
        let endpoint = '/api/products';
        if (params?.clienteId) {
            endpoint = `/api/products?clienteId=${params.clienteId}`;
        }
        // Puedes agregar más filtros aquí si tu backend los soporta
        return apiRequest<Product[]>(endpoint);
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
}

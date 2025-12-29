import { delay } from '../../utils/delay'

export interface Promotion {
    id: string
    title: string
    description: string
    imageUrl?: string
    validUntil: string
    discountPercentage: number
}

export const PromotionsService = {
    async getPromotions(): Promise<Promotion[]> {
        await delay(500)
        return []
    },

    async getActivePromotions(): Promise<Promotion[]> {
        await delay(500)
        return []
    }
}

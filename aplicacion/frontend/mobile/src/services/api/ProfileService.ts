import { delay } from '../../utils/delay'

export interface UserProfile {
    id: string
    name: string
    email: string
    phone: string
    address: string
    ruc?: string
    zone: {
        name: string
        deliveryDays: string[]
    }
    vendor: {
        name: string
        phone: string
    }
    // Bodeguero / Employee specifics
    employeeId?: string
    role?: 'bodeguero' | 'cliente' | 'vendedor' | 'transportista'
    shift?: string // e.g., "Mañana", "Tarde"

    // Seller specifics
    commercialGoal?: {
        monthlyTarget: number
        currentProgress: number
        period: string // "Enero 2025"
    }
}

export const ProfileService = {
    async getProfile(): Promise<UserProfile | null> {
        await delay(800)
        return null // Clean state: No hardcoded data
    },

    async updateProfile(data: Partial<UserProfile>): Promise<boolean> {
        await delay(1000)
        return true
    },

    async changePassword(oldPass: string, newPass: string): Promise<boolean> {
        await delay(1000)
        return true
    }
}

import { useFocusEffect } from '@react-navigation/native'
import React, { useState, useCallback } from 'react'
import { View } from 'react-native'

import { Header } from '../../../components/ui/Header'
import { GenericList } from '../../../components/ui/GenericList'
import { DeliveryCard } from '../../../components/ui/DeliveryCard'
import { TransportistaService, type Delivery } from '../../../services/api/TransportistaService'

export function TransportistaDeliveriesScreen() {
    const [deliveries, setDeliveries] = useState<Delivery[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const loadDeliveries = async () => {
        try {
            setIsLoading(true)
            const data = await TransportistaService.getDeliveries()
            setDeliveries(data)
        } catch (error) {
            console.error('Error loading deliveries:', error)
        } finally {
            setIsLoading(false)
        }
    }

    useFocusEffect(
        useCallback(() => {
            loadDeliveries()
        }, [])
    )

    return (
        <View className="flex-1 bg-neutral-50">
            <Header userName="Transportista" role="TRANSPORTISTA" showNotification={false} />
            <GenericList
                items={deliveries}
                isLoading={isLoading}
                onRefresh={loadDeliveries}
                renderItem={(delivery) => <DeliveryCard delivery={delivery} onPress={() => { }} />}
                emptyState={{
                    icon: 'checkmark-circle-outline',
                    title: 'Sin Entregas',
                    message: 'No hay entregas pendientes'
                }}
            />
        </View>
    )
}

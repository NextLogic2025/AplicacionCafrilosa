import React from 'react'
import { useNavigation, useRoute } from '@react-navigation/native'
import { PickingDetail } from '../../../warehouse/components/PickingDetail'

type RouteParams = { pickingId?: string }

export function SupervisorPickingDetailScreen() {
    const navigation = useNavigation<any>()
    const route = useRoute()
    const { pickingId } = (route.params as RouteParams) ?? {}

    if (!pickingId) {
        // Solo listado crea, pero aqui asumimos detalle existente
        navigation.goBack()
        return null
    }

    return (
        <PickingDetail
            pickingId={pickingId}
            allowStart={false}
            allowComplete={false}
            onBack={() => navigation.goBack()}
            onUpdated={() => {}}
        />
    )
}

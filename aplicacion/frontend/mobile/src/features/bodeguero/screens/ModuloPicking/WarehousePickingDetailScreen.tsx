import React from 'react'
import { useNavigation, useRoute } from '@react-navigation/native'
import { PickingDetail } from '../../../warehouse/components/PickingDetail'

type RouteParams = { pickingId?: string }

export function WarehousePickingDetailScreen() {
    const navigation = useNavigation<any>()
    const route = useRoute()
    const { pickingId } = (route.params as RouteParams) ?? {}

    if (!pickingId) {
        navigation.goBack()
        return null
    }

    return (
        <PickingDetail
            pickingId={pickingId}
            allowStart
            allowComplete
            allowPick
            onBack={() => navigation.goBack()}
            onUpdated={() => {}}
        />
    )
}

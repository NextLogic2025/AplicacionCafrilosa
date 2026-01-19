import React from 'react'
import { useNavigation, useRoute } from '@react-navigation/native'
import { StockForm } from '../../../warehouse/components/StockForm'
import { type StockItem } from '../../../../services/api/StockService'

type RouteParams = { stock?: StockItem }

export function SupervisorStockFormScreen() {
    const navigation = useNavigation<any>()
    const route = useRoute()
    const { stock } = (route.params as RouteParams) ?? {}

    return (
        <StockForm
            stock={stock}
            onBack={() => navigation.goBack()}
            onSaved={() => navigation.goBack()}
        />
    )
}

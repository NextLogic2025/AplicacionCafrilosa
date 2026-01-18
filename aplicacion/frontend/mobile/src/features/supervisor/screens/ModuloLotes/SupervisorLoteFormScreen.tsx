import React from 'react'
import { useNavigation, useRoute } from '@react-navigation/native'
import { LoteForm } from '../../../warehouse/components/LoteForm'

type RouteParams = { loteId?: string }

export function SupervisorLoteFormScreen() {
    const navigation = useNavigation<any>()
    const route = useRoute()
    const { loteId } = (route.params as RouteParams) ?? {}

    return (
        <LoteForm
            loteId={loteId}
            onBack={() => navigation.goBack()}
            onSaved={() => navigation.goBack()}
            allowDelete
        />
    )
}

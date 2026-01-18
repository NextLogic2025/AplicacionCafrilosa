import React from 'react'
import { useNavigation } from '@react-navigation/native'
import { PickingCreateForm } from '../../../warehouse/components/PickingCreateForm'

export function SupervisorPickingCreateScreen() {
    const navigation = useNavigation<any>()

    return (
        <PickingCreateForm
            onBack={() => navigation.goBack()}
            onSaved={() => navigation.goBack()}
        />
    )
}

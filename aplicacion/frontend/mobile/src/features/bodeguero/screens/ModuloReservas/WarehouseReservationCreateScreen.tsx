import React from 'react'
import { useNavigation } from '@react-navigation/native'
import { ReservationForm } from '../../../warehouse/components/ReservationForm'

export function WarehouseReservationCreateScreen() {
    const navigation = useNavigation<any>()

    return (
        <ReservationForm
            onBack={() => navigation.goBack()}
            onSaved={(res) => navigation.navigate('WarehouseReservations', { refreshToken: Date.now() })}
        />
    )
}

import React from 'react'
import { useNavigation } from '@react-navigation/native'
import { ReservationForm } from '../../../warehouse/components/ReservationForm'

export function SupervisorReservationCreateScreen() {
    const navigation = useNavigation<any>()

    return (
        <ReservationForm
            onBack={() => navigation.goBack()}
            onSaved={(res) => navigation.navigate('SupervisorReservations', { refreshToken: Date.now() })}
        />
    )
}

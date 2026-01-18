import React from 'react'
import { useNavigation, useRoute } from '@react-navigation/native'
import { ReservationsList } from '../../../warehouse/components/ReservationsList'

type RouteParams = { refreshToken?: number }

export function SupervisorReservationsScreen() {
    const navigation = useNavigation<any>()
    const route = useRoute()
    const { refreshToken } = (route.params as RouteParams) ?? {}
    const [localRefresh, setLocalRefresh] = React.useState(0)

    React.useEffect(() => {
        if (refreshToken) setLocalRefresh((v) => v + 1)
    }, [refreshToken])

    return (
        <ReservationsList
            title="Reservas"
            onBack={() => navigation.goBack()}
            onCreate={undefined}
            onOpen={() => {}}
            refreshToken={localRefresh}
        />
    )
}

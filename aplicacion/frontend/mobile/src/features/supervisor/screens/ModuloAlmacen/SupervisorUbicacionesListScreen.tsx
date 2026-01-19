import React from 'react'
import { useNavigation, useRoute } from '@react-navigation/native'
import { UbicacionesList } from '../../../warehouse/components/UbicacionesList'

type RouteParams = { almacenId?: number }

export function SupervisorUbicacionesListScreen() {
    const navigation = useNavigation<any>()
    const route = useRoute()
    const { almacenId } = (route.params as RouteParams) ?? {}
    const [refreshToken, setRefreshToken] = React.useState(0)

    React.useEffect(() => {
        const unsub = navigation.addListener('focus', () => {
            setRefreshToken((v) => v + 1)
        })
        return unsub
    }, [navigation])

    return (
        <UbicacionesList
            title="Ubicaciones"
            initialAlmacenId={almacenId ?? null}
            onBack={() => navigation.goBack()}
            onCreate={(id) => navigation.navigate('SupervisorUbicacionForm', { almacenId: id })}
            onOpen={(ubicacionId) => navigation.navigate('SupervisorUbicacionForm', { ubicacionId })}
            refreshToken={refreshToken}
        />
    )
}

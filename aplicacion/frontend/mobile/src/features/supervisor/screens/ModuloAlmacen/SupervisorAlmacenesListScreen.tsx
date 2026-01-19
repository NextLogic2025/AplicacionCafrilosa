import React from 'react'
import { useNavigation } from '@react-navigation/native'
import { AlmacenesList } from '../../../warehouse/components/AlmacenesList'
import { ExpandableFab } from '../../../../components/ui/ExpandableFab'

export function SupervisorAlmacenesListScreen() {
    const navigation = useNavigation<any>()
    const [refreshToken, setRefreshToken] = React.useState(0)

    React.useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            setRefreshToken((v) => v + 1)
        })
        return unsubscribe
    }, [navigation])

    return (
        <>
            <AlmacenesList
                title="Almacenes"
                allowToggle
                onBack={() => navigation.goBack()}
                onCreate={() => navigation.navigate('SupervisorAlmacenForm')}
                onOpen={(id) => navigation.navigate('SupervisorAlmacenForm', { almacenId: id })}
                refreshToken={refreshToken}
            />
            <ExpandableFab
                actions={[
                    {
                        icon: 'add',
                        label: 'Ubicaciones',
                        onPress: () => navigation.navigate('SupervisorUbicaciones', { almacenId: null }),
                    },
                ]}
            />
        </>
    )
}

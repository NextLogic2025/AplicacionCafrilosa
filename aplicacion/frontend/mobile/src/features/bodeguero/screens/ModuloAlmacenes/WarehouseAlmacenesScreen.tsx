import React, { useState } from 'react'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import { AlmacenesList } from '../../../warehouse/components/AlmacenesList'
import { ExpandableFab } from '../../../../components/ui/ExpandableFab'

export function WarehouseAlmacenesScreen() {
    const navigation = useNavigation<any>()
    const [refreshToken, setRefreshToken] = useState(0)

    useFocusEffect(
        React.useCallback(() => {
            setRefreshToken((v) => v + 1)
        }, [])
    )

    return (
        <>
            <AlmacenesList
                title="Almacenes"
                allowToggle
                onBack={() => {}}
                onCreate={() => navigation.navigate('WarehouseAlmacenForm')}
                onOpen={(id) => navigation.navigate('WarehouseAlmacenForm', { almacenId: id })}
                refreshToken={refreshToken}
            />
            <ExpandableFab
                actions={[
                    {
                        icon: 'add',
                        label: 'Ubicaciones',
                        onPress: () => navigation.navigate('WarehouseUbicaciones', { almacenId: null }),
                    },
                ]}
            />
        </>
    )
}

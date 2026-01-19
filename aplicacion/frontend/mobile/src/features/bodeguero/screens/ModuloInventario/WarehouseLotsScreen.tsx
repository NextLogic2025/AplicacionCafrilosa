import React from 'react'
import { useNavigation } from '@react-navigation/native'
import { LotesList } from '../../../warehouse/components/LotesList'

export function WarehouseLotsScreen() {
    const navigation = useNavigation<any>()
    const [refreshToken, setRefreshToken] = React.useState(0)

    React.useEffect(() => {
        const unsub = navigation.addListener('focus', () => setRefreshToken((v) => v + 1))
        return unsub
    }, [navigation])

    return (
        <LotesList
            title="Lotes"
            onBack={() => navigation.goBack()}
            onCreate={() => navigation.navigate('WarehouseLoteForm')}
            onOpen={(id) => navigation.navigate('WarehouseLoteForm', { loteId: id })}
            allowDelete={false}
            refreshToken={refreshToken}
        />
    )
}

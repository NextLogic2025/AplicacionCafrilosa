import React from 'react'
import { useNavigation } from '@react-navigation/native'
import { PickingList } from '../../../warehouse/components/PickingList'

export function WarehousePickingListScreen() {
    const navigation = useNavigation<any>()
    const [refreshToken, setRefreshToken] = React.useState(0)

    React.useEffect(() => {
        const unsub = navigation.addListener('focus', () => setRefreshToken((v) => v + 1))
        return unsub
    }, [navigation])

    return (
        <PickingList
            title="Ordenes de Picking"
            showTakeButton
            onBack={() => navigation.goBack()}
            onOpen={(id) => navigation.navigate('WarehousePickingDetail', { pickingId: id })}
            refreshToken={refreshToken}
        />
    )
}

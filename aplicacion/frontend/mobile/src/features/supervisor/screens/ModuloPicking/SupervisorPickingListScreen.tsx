import React from 'react'
import { useNavigation } from '@react-navigation/native'
import { PickingList } from '../../../warehouse/components/PickingList'

export function SupervisorPickingListScreen() {
    const navigation = useNavigation<any>()
    const [refreshToken, setRefreshToken] = React.useState(0)

    React.useEffect(() => {
        const unsub = navigation.addListener('focus', () => setRefreshToken((v) => v + 1))
        return unsub
    }, [navigation])

    return (
        <PickingList
            title="Pickings"
            onBack={() => navigation.goBack()}
            onCreate={() => navigation.navigate('SupervisorPickingCreate')}
            onOpen={(id) => navigation.navigate('SupervisorPickingDetail', { pickingId: id })}
            refreshToken={refreshToken}
        />
    )
}

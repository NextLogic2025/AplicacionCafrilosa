import React from 'react'
import { useNavigation } from '@react-navigation/native'
import { StockList } from '../../../warehouse/components/StockList'

export function SupervisorStockListScreen() {
    const navigation = useNavigation<any>()
    const [refreshToken, setRefreshToken] = React.useState(0)

    React.useEffect(() => {
        const unsub = navigation.addListener('focus', () => setRefreshToken((v) => v + 1))
        return unsub
    }, [navigation])

    return (
        <StockList
            title="Stock"
            onBack={() => navigation.goBack()}
            onCreate={() => navigation.navigate('SupervisorStockForm')}
            onOpen={(item) => navigation.navigate('SupervisorStockForm', { stock: item })}
            refreshToken={refreshToken}
        />
    )
}

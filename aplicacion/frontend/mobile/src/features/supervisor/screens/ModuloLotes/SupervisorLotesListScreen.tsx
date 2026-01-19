import React from 'react'
import { useNavigation } from '@react-navigation/native'
import { LotesList } from '../../../warehouse/components/LotesList'
import { LoteService } from '../../../../services/api/LoteService'

export function SupervisorLotesListScreen() {
    const navigation = useNavigation<any>()
    const [refreshToken, setRefreshToken] = React.useState(0)

    React.useEffect(() => {
        const unsub = navigation.addListener('focus', () => setRefreshToken((v) => v + 1))
        return unsub
    }, [navigation])

    const handleDelete = async (id: string) => {
        await LoteService.remove(id)
    }

    return (
        <LotesList
            title="Lotes"
            onBack={() => navigation.goBack()}
            onCreate={() => navigation.navigate('SupervisorLoteForm')}
            onOpen={(id) => navigation.navigate('SupervisorLoteForm', { loteId: id })}
            onDelete={handleDelete}
            allowDelete
            refreshToken={refreshToken}
        />
    )
}

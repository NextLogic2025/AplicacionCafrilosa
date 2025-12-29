import { View, Text } from 'react-native'
import { EmptyState } from '../../../components/ui/EmptyState'
import { Header } from '../../../components/ui/Header'

export function PlaceholderScreen({ route }: any) {
    return (
        <View className="flex-1 bg-white">
            <Header userName="Usuario" role="Navegación" showNotification={false} />
            <View className="flex-1 justify-center">
                <EmptyState
                    icon="construct-outline"
                    title="En construcción"
                    description={`La pantalla de ${route.name} estará disponible pronto.`}
                />
            </View>
        </View>
    )
}

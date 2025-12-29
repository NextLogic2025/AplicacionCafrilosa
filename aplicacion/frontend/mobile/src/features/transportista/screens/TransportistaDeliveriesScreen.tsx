import * as React from 'react'
import { View, Text, FlatList, RefreshControl, ActivityIndicator, Pressable, TextInput, Modal, Alert } from 'react-native'
import { Header } from '../../../components/ui/Header'
import { TransportistaService, type Delivery } from '../../../services/api/TransportistaService'
import { Ionicons } from '@expo/vector-icons'
import { BRAND_COLORS } from '@cafrilosa/shared-types'
import { ExpandableFab, type FabAction } from '../../../components/ui/ExpandableFab'
import { useNavigation } from '@react-navigation/native'

// Internal Evidence Modal
const ConfirmationModal = ({ visible, onClose, onSubmit, delivery }: { visible: boolean, onClose: () => void, onSubmit: () => void, delivery: Delivery | null }) => {
    const [observation, setObservation] = React.useState('')
    const [hasPhoto, setHasPhoto] = React.useState(false)
    const [hasSignature, setHasSignature] = React.useState(false)

    if (!delivery) return null

    const handleSubmit = () => {
        if (!hasPhoto || !hasSignature) {
            Alert.alert('Faltan Evidencias', 'Debes registrar al menos una foto y la firma digital.')
            return
        }
        onSubmit()
    }

    return (
        <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
            <View className="flex-1 bg-black/50 justify-end">
                <View className="bg-white rounded-t-3xl p-6 h-[80%]">
                    <View className="flex-row justify-between items-center mb-6 border-b border-neutral-100 pb-4">
                        <Text className="text-xl font-bold text-neutral-900">Confirmar Entrega</Text>
                        <Pressable onPress={onClose}>
                            <Ionicons name="close-circle" size={28} color="#9CA3AF" />
                        </Pressable>
                    </View>

                    <Text className="text-sm text-neutral-500 mb-1">Cliente</Text>
                    <Text className="text-lg font-bold text-neutral-900 mb-4">{delivery.clientName}</Text>

                    {/* Evidence Buttons */}
                    <Text className="text-sm font-bold text-neutral-900 mb-3">Evidencias Requeridas</Text>
                    <View className="flex-row gap-4 mb-6">
                        <Pressable
                            onPress={() => setHasPhoto(!hasPhoto)}
                            className={`flex-1 p-4 rounded-xl border-2 items-center justify-center ${hasPhoto ? 'border-green-500 bg-green-50' : 'border-dashed border-neutral-300 bg-neutral-50'}`}
                        >
                            <Ionicons name={hasPhoto ? "checkmark-circle" : "camera-outline"} size={32} color={hasPhoto ? "#10B981" : "#6B7280"} />
                            <Text className={`mt-2 font-medium ${hasPhoto ? 'text-green-700' : 'text-neutral-500'}`}>
                                {hasPhoto ? 'Foto OK' : 'Tomar Foto'}
                            </Text>
                        </Pressable>

                        <Pressable
                            onPress={() => setHasSignature(!hasSignature)}
                            className={`flex-1 p-4 rounded-xl border-2 items-center justify-center ${hasSignature ? 'border-green-500 bg-green-50' : 'border-dashed border-neutral-300 bg-neutral-50'}`}
                        >
                            <Ionicons name={hasSignature ? "checkmark-circle" : "pencil-outline"} size={32} color={hasSignature ? "#10B981" : "#6B7280"} />
                            <Text className={`mt-2 font-medium ${hasSignature ? 'text-green-700' : 'text-neutral-500'}`}>
                                {hasSignature ? 'Firma OK' : 'Firma Digital'}
                            </Text>
                        </Pressable>
                    </View>

                    {/* Observation */}
                    <Text className="text-sm font-bold text-neutral-900 mb-2">Observaciones (Opcional)</Text>
                    <TextInput
                        className="bg-neutral-50 border border-neutral-200 rounded-xl p-3 h-24 mb-6"
                        multiline
                        textAlignVertical="top"
                        placeholder="Ej: Entregado en portería..."
                        value={observation}
                        onChangeText={setObservation}
                    />

                    {/* Submit */}
                    <Pressable
                        onPress={handleSubmit}
                        className={`py-4 rounded-xl items-center ${(!hasPhoto || !hasSignature) ? 'bg-neutral-300' : 'bg-brand-red'}`}
                    >
                        <Text className="text-white font-bold text-lg">Finalizar Entrega</Text>
                    </Pressable>
                </View>
            </View>
        </Modal>
    )
}

function DeliveryCard({ delivery, onConfirm }: { delivery: Delivery, onConfirm: (d: Delivery) => void }) {
    return (
        <View className="bg-white rounded-xl p-5 mb-4 border border-neutral-100 shadow-sm relative overflow-hidden">
            {/* Left color bar based on state */}
            <View className={`absolute left-0 top-0 bottom-0 w-1.5 ${delivery.status === 'in_transit' ? 'bg-blue-500' : 'bg-neutral-300'}`} />

            <View className="flex-row justify-between items-start mb-2 pl-2">
                <View>
                    <Text className="text-neutral-500 text-xs font-bold">Ruta Actual • {delivery.estimatedTime}</Text>
                    <Text className="text-neutral-900 text-lg font-bold">{delivery.clientName}</Text>
                </View>
            </View>

            <View className="pl-2">
                <View className="flex-row items-center mb-1">
                    <Ionicons name="location-outline" size={16} color="#4B5563" style={{ marginRight: 4 }} />
                    <Text className="text-neutral-600 text-sm flex-1">{delivery.address}</Text>
                </View>
                <View className="flex-row items-center mb-3">
                    <Ionicons name="call-outline" size={16} color="#4B5563" style={{ marginRight: 4 }} />
                    <Text className="text-neutral-600 text-sm">{delivery.contact || 'Sin contacto'}</Text>
                </View>

                {delivery.status !== 'delivered' && (
                    <Pressable
                        onPress={() => onConfirm(delivery)}
                        className="bg-neutral-900 py-3 rounded-lg flex-row justify-center items-center active:bg-neutral-800"
                    >
                        <Ionicons name="checkmark-done-circle" size={20} color="white" style={{ marginRight: 8 }} />
                        <Text className="text-white font-bold">Confirmar Entrega</Text>
                    </Pressable>
                )}
            </View>
        </View>
    )
}

function EmptyState() {
    return (
        <View className="flex-1 justify-center items-center py-20 px-6">
            <View className="bg-neutral-100 p-4 rounded-full mb-4">
                <Ionicons name="bus-outline" size={48} color="#9CA3AF" />
            </View>
            <Text className="text-neutral-900 text-lg font-bold text-center mb-2">Sin entregas pendientes</Text>
            <Text className="text-neutral-400 text-sm text-center">
                ¡Gran trabajo! Has completado todas las entregas asignadas por hoy.
            </Text>
        </View>
    )
}

export function TransportistaDeliveriesScreen() {
    const navigation = useNavigation()
    const [deliveries, setDeliveries] = React.useState<Delivery[]>([])
    const [loading, setLoading] = React.useState(true)
    const [refreshing, setRefreshing] = React.useState(false)
    const [selectedDelivery, setSelectedDelivery] = React.useState<Delivery | null>(null)
    const [modalVisible, setModalVisible] = React.useState(false)

    const loadData = async () => {
        try {
            const data = await TransportistaService.getDeliveries()
            // Filter out delivered ones for the active list, or keep them? Usually active list implies pending.
            // Let's keep pending and in_transit
            const active = data.filter(d => d.status !== 'delivered')
            setDeliveries(active)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    React.useEffect(() => {
        loadData()
    }, [])

    const openConfirmModal = (delivery: Delivery) => {
        setSelectedDelivery(delivery)
        setModalVisible(true)
    }

    const handleConfirmSuccess = () => {
        setModalVisible(false)
        // Optimistic Remove
        if (selectedDelivery) {
            setDeliveries(prev => prev.filter(d => d.id !== selectedDelivery.id))
            Alert.alert("Entrega Exitosa", "La entrega ha sido registrada correctamente.")
        }
    }

    const fabActions: FabAction[] = [
        // @ts-ignore
        { icon: 'map-outline', label: 'Rutas', onPress: () => navigation.navigate('TransportistaRoutes') },
        // @ts-ignore
        { icon: 'refresh-circle-outline', label: 'Devoluciones', onPress: () => navigation.navigate('TransportistaReturns') },
        // @ts-ignore
        { icon: 'time-outline', label: 'Historial', onPress: () => navigation.navigate('TransportistaHistory') },
        // @ts-ignore
        { icon: 'notifications-outline', label: 'Notificaciones', onPress: () => navigation.navigate('TransportistaNotifications') },
    ]

    return (
        <View className="flex-1 bg-neutral-50">
            <Header
                userName="Transportista"
                variant="standard"
                title="Ruta de Entregas"
            />

            {loading ? (
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color={BRAND_COLORS.red} />
                </View>
            ) : (
                <FlatList
                    data={deliveries}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => <DeliveryCard delivery={item} onConfirm={openConfirmModal} />}
                    contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
                    ListEmptyComponent={EmptyState}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} colors={[BRAND_COLORS.red]} />}
                />
            )}

            <ConfirmationModal
                visible={modalVisible}
                delivery={selectedDelivery}
                onClose={() => setModalVisible(false)}
                onSubmit={handleConfirmSuccess}
            />

            <ExpandableFab actions={fabActions} />
        </View>
    )
}

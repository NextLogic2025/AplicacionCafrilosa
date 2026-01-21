import React, { useState } from 'react'
import { View, Text, Pressable } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'

import { Header } from '../../../../components/ui/Header'
import { SearchBar } from '../../../../components/ui/SearchBar'
import { CategoryFilter } from '../../../../components/ui/CategoryFilter'
import { GenericList } from '../../../../components/ui/GenericList'
import { FeedbackModal, type FeedbackType } from '../../../../components/ui/FeedbackModal'
import { ConfirmationModal } from '../../../../components/ui/ConfirmationModal'
import { VehicleCard } from '../../../../components/ui/VehicleCard'
import { useStableInsets } from '../../../../hooks/useStableInsets'
import { usePolling } from '../../../../hooks/useRealtimeSync'
import { VehicleService, type Vehicle, type VehicleEstado } from '../../../../services/api/VehicleService'
import { getUserFriendlyMessage } from '../../../../utils/errorMessages'
import { BRAND_COLORS } from '../../../../shared/types'

type FilterStatus = 'todos' | VehicleEstado

const FILTER_CATEGORIES = [
    { id: 'todos', name: 'Todos' },
    { id: 'DISPONIBLE', name: 'Disponible' },
    { id: 'EN_RUTA', name: 'En Ruta' },
    { id: 'MANTENIMIENTO', name: 'Mantenimiento' },
    { id: 'INACTIVO', name: 'Inactivo' },
]

export function SupervisorVehiclesListScreen() {
    const navigation = useNavigation<any>()
    const insets = useStableInsets()

    const [vehicles, setVehicles] = useState<Vehicle[]>([])
    const [searchQuery, setSearchQuery] = useState('')
    const [filterStatus, setFilterStatus] = useState<FilterStatus>('todos')
    const [deletingId, setDeletingId] = useState<string | null>(null)

    const [feedbackModal, setFeedbackModal] = useState<{
        visible: boolean
        type: FeedbackType
        title: string
        message: string
    }>({
        visible: false,
        type: 'info',
        title: '',
        message: '',
    })

    const fetchVehicles = async () => {
        try {
            const data = await VehicleService.list()
            setVehicles(data)
        } catch (error) {
            console.error('Error fetching vehicles:', error)
        }
    }

    usePolling(fetchVehicles, 10000, true)

    const filteredVehicles = vehicles.filter((vehicle) => {
        const matchesSearch =
            !searchQuery ||
            vehicle.placa.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (vehicle.marca && vehicle.marca.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (vehicle.modelo && vehicle.modelo.toLowerCase().includes(searchQuery.toLowerCase()))

        const matchesFilter =
            filterStatus === 'todos' || vehicle.estado === filterStatus

        return matchesSearch && matchesFilter
    })

    const handleDelete = async (id: string) => {
        setDeletingId(id)
        try {
            await VehicleService.delete(id)
            setFeedbackModal({
                visible: true,
                type: 'success',
                title: 'Vehículo Eliminado',
                message: 'El vehículo ha sido eliminado exitosamente.',
            })
            fetchVehicles()
        } catch (error) {
            setFeedbackModal({
                visible: true,
                type: 'error',
                title: 'Error al Eliminar',
                message: getUserFriendlyMessage(error, 'DELETE_ERROR'),
            })
        } finally {
            setDeletingId(null)
        }
    }

    return (
        <View className="flex-1 bg-neutral-50">
            <Header
                title="Gestión de Vehículos"
                variant="standard"
                onBackPress={() => navigation.goBack()}
            />

            <View className="px-4 py-3 flex-row items-center gap-3">
                <View className="flex-1">
                    <SearchBar
                        placeholder="Buscar vehículo..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
                <Pressable
                    onPress={() => navigation.navigate('SupervisorVehicleForm')}
                    className="w-14 h-14 rounded-2xl items-center justify-center active:opacity-80"
                    style={{ backgroundColor: BRAND_COLORS.red, elevation: 4 }}
                >
                    <Ionicons name="add" size={28} color="white" />
                </Pressable>
            </View>

            <CategoryFilter
                categories={FILTER_CATEGORIES}
                selectedId={filterStatus}
                onSelect={(id) => setFilterStatus(id as FilterStatus)}
            />

            <GenericList
                items={filteredVehicles}
                isLoading={false}
                onRefresh={fetchVehicles}
                renderItem={(vehicle) => (
                    <VehicleCard
                        vehicle={vehicle}
                        onPress={() =>
                            navigation.navigate('SupervisorVehicleDetail', {
                                vehicleId: vehicle.id,
                            })
                        }
                        onEdit={() =>
                            navigation.navigate('SupervisorVehicleForm', {
                                vehicleId: vehicle.id,
                            })
                        }
                        onDelete={() => setDeletingId(vehicle.id)}
                        showActions={deletingId !== vehicle.id}
                    />
                )}
                emptyState={{
                    icon: 'car',
                    title: 'No hay vehículos',
                    message:
                        searchQuery || filterStatus !== 'todos'
                            ? 'No se encontraron vehículos que coincidan con tu búsqueda.'
                            : 'Aún no has registrado ningún vehículo.',
                }}
            />

            <ConfirmationModal
                visible={!!deletingId && !!vehicles.find((v) => v.id === deletingId)}
                title="¿Eliminar Vehículo?"
                message={`¿Estás seguro de que deseas eliminar el vehículo ${vehicles.find((v) => v.id === deletingId)?.placa || 'este vehículo'
                    }? Esta acción no se puede deshacer.`}
                confirmText="Eliminar"
                cancelText="Cancelar"
                isDestructive={true}
                icon="trash-outline"
                onConfirm={() => {
                    if (deletingId) handleDelete(deletingId)
                }}
                onCancel={() => setDeletingId(null)}
            />

            <FeedbackModal
                visible={feedbackModal.visible}
                type={feedbackModal.type}
                title={feedbackModal.title}
                message={feedbackModal.message}
                onClose={() => setFeedbackModal((prev) => ({ ...prev, visible: false }))}
            />
        </View>
    )
}

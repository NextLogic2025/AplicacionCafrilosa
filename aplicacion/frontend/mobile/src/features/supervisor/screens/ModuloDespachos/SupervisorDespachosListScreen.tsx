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
import { DespachoCard } from '../../../../components/ui/DespachoCard'
import { useStableInsets } from '../../../../hooks/useStableInsets'
import { usePolling } from '../../../../hooks/useRealtimeSync'
import { DespachosService, type Despacho, type DespachoEstadoViaje } from '../../../../services/api/DespachosService'
import { getUserFriendlyMessage } from '../../../../utils/errorMessages'
import { BRAND_COLORS } from '../../../../shared/types'

type FilterStatus = 'todos' | DespachoEstadoViaje

const FILTER_CATEGORIES = [
    { id: 'todos', name: 'Todos' },
    { id: 'PLANIFICACION', name: 'Planificación' },
    { id: 'CONFIRMADO', name: 'Confirmado' },
    { id: 'EN_RUTA', name: 'En Ruta' },
    { id: 'COMPLETADO', name: 'Completado' },
    { id: 'CANCELADO', name: 'Cancelado' },
]

export function SupervisorDespachosListScreen() {
    const navigation = useNavigation<any>()
    const insets = useStableInsets()

    const [despachos, setDespachos] = useState<Despacho[]>([])
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

    const fetchDespachos = async () => {
        try {
            const data = await DespachosService.list()
            setDespachos(data)
        } catch (error) {
            console.error('Error fetching despachos:', error)
        }
    }

    usePolling(fetchDespachos, 10000, true)

    const filteredDespachos = despachos.filter((despacho) => {
        const matchesSearch =
            !searchQuery ||
            (despacho.codigo_manifiesto && despacho.codigo_manifiesto.toString().includes(searchQuery)) ||
            (despacho.vehiculo?.placa && despacho.vehiculo.placa.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (despacho.conductor?.nombre_completo && despacho.conductor.nombre_completo.toLowerCase().includes(searchQuery.toLowerCase()))

        const matchesFilter =
            filterStatus === 'todos' || despacho.estado_viaje === filterStatus

        return matchesSearch && matchesFilter
    })

    const handleDelete = async (id: string) => {
        setDeletingId(id)
        try {
            await DespachosService.delete(id)
            setFeedbackModal({
                visible: true,
                type: 'success',
                title: 'Despacho Eliminado',
                message: 'El despacho ha sido eliminado exitosamente.',
            })
            fetchDespachos()
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
                title="Gestión de Despachos"
                variant="standard"
                onBackPress={() => navigation.goBack()}
            />

            <View className="px-4 py-3 flex-row items-center gap-3">
                <View className="flex-1">
                    <SearchBar
                        placeholder="Buscar despacho..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
                <Pressable
                    onPress={() => navigation.navigate('SupervisorDespachoForm')}
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
                items={filteredDespachos}
                isLoading={false}
                onRefresh={fetchDespachos}
                renderItem={(despacho) => (
                    <DespachoCard
                        despacho={despacho}
                        onPress={() =>
                            navigation.navigate('SupervisorDespachoDetail', {
                                despachoId: despacho.id,
                            })
                        }
                        onEdit={() =>
                            navigation.navigate('SupervisorDespachoForm', {
                                despachoId: despacho.id,
                            })
                        }
                        onDelete={() => setDeletingId(despacho.id)}
                        showActions={deletingId !== despacho.id}
                    />
                )}
                emptyState={{
                    icon: 'document-text',
                    title: 'No hay despachos',
                    message:
                        searchQuery || filterStatus !== 'todos'
                            ? 'No se encontraron despachos que coincidan con tu búsqueda.'
                            : 'Aún no has registrado ningún despacho.',
                }}
            />

            <ConfirmationModal
                visible={!!deletingId && !!despachos.find((d) => d.id === deletingId)}
                title="¿Eliminar Despacho?"
                message={`¿Estás seguro de que deseas eliminar este despacho? Esta acción no se puede deshacer.`}
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

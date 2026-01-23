import React, { useState } from 'react'
import { View, Text, Pressable } from 'react-native'
import { useNavigation, useFocusEffect } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'

import { Header } from '../../../../components/ui/Header'
import { SearchBar } from '../../../../components/ui/SearchBar'
import { CategoryFilter } from '../../../../components/ui/CategoryFilter'
import { GenericList } from '../../../../components/ui/GenericList'
import { FeedbackModal, type FeedbackType } from '../../../../components/ui/FeedbackModal'
import { ConfirmationModal } from '../../../../components/ui/ConfirmationModal'
import { ConductorCard } from '../../../../components/ui/ConductorCard'
import { useStableInsets } from '../../../../hooks/useStableInsets'
import { ConductorService, type Conductor } from '../../../../services/api/ConductorService'
import { getUserFriendlyMessage } from '../../../../utils/errorMessages'
import { BRAND_COLORS } from '../../../../shared/types'

type FilterStatus = 'todos' | 'activos' | 'inactivos'

const FILTER_CATEGORIES = [
    { id: 'todos', name: 'Todos' },
    { id: 'activos', name: 'Activos' },
    { id: 'inactivos', name: 'Inactivos' },
]

export function SupervisorConductoresListScreen() {
    const navigation = useNavigation<any>()
    const insets = useStableInsets()

    const [conductores, setConductores] = useState<Conductor[]>([])
    const [searchQuery, setSearchQuery] = useState('')
    const [filterStatus, setFilterStatus] = useState<FilterStatus>('todos')
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

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

    const fetchConductores = async () => {
        setLoading(true)
        try {
            const data = await ConductorService.list()
            setConductores(data)
        } catch (error: any) {
            // Silenciar error 403 mientras el backend se configura
            if (error?.message?.includes('403') || error?.message?.includes('permisos')) {
                return
            }
            console.error('Error fetching conductores:', error)
        } finally {
            setLoading(false)
        }
    }

    useFocusEffect(
        React.useCallback(() => {
            fetchConductores()
        }, [])
    )

    const filteredConductores = conductores.filter((conductor) => {
        const matchesSearch =
            !searchQuery ||
            conductor.nombre_completo.toLowerCase().includes(searchQuery.toLowerCase()) ||
            conductor.cedula.includes(searchQuery)

        const matchesFilter =
            filterStatus === 'todos' ||
            (filterStatus === 'activos' && conductor.activo) ||
            (filterStatus === 'inactivos' && !conductor.activo)

        return matchesSearch && matchesFilter
    })

    const handleDelete = async (id: string) => {
        setDeletingId(id)
        try {
            await ConductorService.delete(id)
            setFeedbackModal({
                visible: true,
                type: 'success',
                title: 'Conductor Eliminado',
                message: 'El conductor ha sido eliminado exitosamente.',
            })
            fetchConductores()
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
                title="Gestión de Conductores"
                variant="standard"
                onBackPress={() => navigation.goBack()}
            />

            <View className="px-4 py-3 flex-row items-center gap-3">
                <View className="flex-1">
                    <SearchBar
                        placeholder="Buscar conductor..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
                <Pressable
                    onPress={() => navigation.navigate('SupervisorConductorForm')}
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
                items={filteredConductores}
                isLoading={false}
                onRefresh={fetchConductores}
                renderItem={(conductor) => (
                    <ConductorCard
                        conductor={conductor}
                        onPress={() =>
                            navigation.navigate('SupervisorConductorDetail', {
                                conductorId: conductor.id,
                            })
                        }
                        onEdit={() =>
                            navigation.navigate('SupervisorConductorForm', {
                                conductorId: conductor.id,
                            })
                        }
                        onDelete={() => setDeletingId(conductor.id)}
                        showActions={deletingId !== conductor.id}
                    />
                )}
                emptyState={{
                    icon: 'car',
                    title: 'No hay conductores',
                    message:
                        searchQuery || filterStatus !== 'todos'
                            ? 'No se encontraron conductores que coincidan con tu búsqueda.'
                            : 'Aún no has registrado ningún conductor.',
                }}
            />

            <ConfirmationModal
                visible={!!deletingId && !!conductores.find((c) => c.id === deletingId)}
                title="¿Eliminar Conductor?"
                message={`¿Estás seguro de que deseas eliminar a ${conductores.find((c) => c.id === deletingId)?.nombre_completo || 'este conductor'
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

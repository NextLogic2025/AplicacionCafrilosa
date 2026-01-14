import React, { useEffect, useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { BRAND_COLORS } from '../../../shared/types'
import { RouteService, RoutePlan } from '../../../services/api/RouteService'
import { ZoneService, Zone } from '../../../services/api/ZoneService'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import { FeedbackModal, FeedbackType } from '../../../components/ui/FeedbackModal'

interface Props {
    onSelectRoute: (zoneId: number, day: number) => void
}

export function SavedRoutesSummary({ onSelectRoute }: Props) {
    const [loading, setLoading] = useState(true)
    const [summary, setSummary] = useState<any[]>([])

    // Feedback Modal State
    const [feedbackModal, setFeedbackModal] = useState<{
        visible: boolean
        type: FeedbackType
        title: string
        message: string
        onConfirm?: () => void
        showCancel?: boolean
    }>({
        visible: false,
        type: 'success',
        title: '',
        message: ''
    })

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            const [routes, zones] = await Promise.all([
                RouteService.getAll(),
                ZoneService.getZones()
            ])

            // Group by Zone+Day
            const grouped: any = {}

            routes.forEach(r => {
                const key = `${r.zona_id}-${r.dia_semana}`
                if (!grouped[key]) {
                    const zoneName = zones.find(z => z.id === r.zona_id)?.nombre || `Zona ${r.zona_id}`
                    grouped[key] = {
                        key,
                        zona_id: r.zona_id,
                        dia_semana: r.dia_semana,
                        zona_nombre: zoneName,
                        count: 0
                    }
                }
                grouped[key].count++
            })

            setSummary(Object.values(grouped))
        } catch (error) {
            console.error('Error loading summary', error)
        } finally {
            setLoading(false)
        }
    }

    const getDayName = (d: number) => {
        const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
        return days[d - 1] || 'Día Desconocido'
    }

    if (loading) {
        return <ActivityIndicator size="large" color={BRAND_COLORS.red} className="mt-10" />
    }

    if (summary.length === 0) {
        return (
            <View className="flex-1 items-center justify-center p-8 opacity-50">
                <Ionicons name="folder-open-outline" size={48} color="#9CA3AF" />
                <Text className="text-neutral-500 mt-4 font-medium">No hay rutas guardadas aún.</Text>
            </View>
        )
    }

    const handleDeleteRoute = (zoneId: number, day: number, zoneName: string) => {
        setFeedbackModal({
            visible: true,
            type: 'warning',
            title: 'Eliminar Ruta',
            message: `¿Estás seguro de eliminar la ruta de ${zoneName} - ${getDayName(day)}?`,
            showCancel: true,
            onConfirm: async () => {
                setFeedbackModal({ ...feedbackModal, visible: false })
                try {
                    const routes = await RouteService.getAll()
                    const toDelete = routes.filter(r => r.zona_id === zoneId && r.dia_semana === day)
                    await Promise.all(toDelete.map(r => RouteService.delete(r.id)))
                    loadData()
                    setFeedbackModal({
                        visible: true,
                        type: 'success',
                        title: 'Ruta Eliminada',
                        message: 'La ruta se eliminó correctamente'
                    })
                } catch (error) {
                    setFeedbackModal({
                        visible: true,
                        type: 'error',
                        title: 'Error al eliminar',
                        message: 'No se pudo eliminar la ruta. Intenta nuevamente'
                    })
                }
            }
        })
    }

    return (
        <ScrollView className="flex-1 bg-neutral-50 p-4">
            {summary.map((item) => (
                <View key={item.key} className="bg-white rounded-2xl mb-4 overflow-hidden shadow-md border border-neutral-100">
                    {/* Header with gradient */}
                    <View className="bg-red-50 px-4 py-3 border-b border-red-100">
                        <View className="flex-row items-center justify-between">
                            <View className="flex-row items-center flex-1">
                                <View className="w-12 h-12 rounded-xl bg-red-500 items-center justify-center mr-3 shadow-sm">
                                    <Ionicons name="map" size={24} color="white" />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-lg font-bold text-neutral-900">{item.zona_nombre}</Text>
                                    <Text className="text-xs text-neutral-500 mt-0.5">Ruta planificada</Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Content */}
                    <View className="px-4 py-3">
                        {/* Info Row */}
                        <View className="flex-row items-center justify-between mb-4">
                            <View className="flex-row items-center gap-3">
                                <StatusBadge
                                    label={getDayName(item.dia_semana)}
                                    variant="primary"
                                    icon="calendar"
                                    size="md"
                                />
                                <View className="flex-row items-center">
                                    <Ionicons name="people" size={16} color="#6B7280" />
                                    <Text className="text-neutral-600 font-bold text-sm ml-1">
                                        {item.count} {item.count === 1 ? 'Cliente' : 'Clientes'}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* Action Buttons */}
                        <View className="flex-row gap-2">
                            <TouchableOpacity
                                onPress={() => onSelectRoute(item.zona_id, item.dia_semana)}
                                className="flex-1 bg-red-500 py-3 rounded-xl flex-row items-center justify-center shadow-sm"
                            >
                                <Ionicons name="create" size={18} color="white" />
                                <Text className="text-white font-bold text-sm ml-2">Ver / Editar</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => handleDeleteRoute(item.zona_id, item.dia_semana, item.zona_nombre)}
                                className="bg-neutral-100 px-4 py-3 rounded-xl border border-neutral-200"
                            >
                                <Ionicons name="trash-outline" size={20} color="#DC2626" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            ))}
            <View className="h-20" />

            <FeedbackModal
                visible={feedbackModal.visible}
                type={feedbackModal.type}
                title={feedbackModal.title}
                message={feedbackModal.message}
                onClose={() => setFeedbackModal({ ...feedbackModal, visible: false })}
                onConfirm={feedbackModal.onConfirm}
                showCancel={feedbackModal.showCancel}
                confirmText={feedbackModal.type === 'warning' ? 'Eliminar' : 'Entendido'}
            />
        </ScrollView>
    )
}

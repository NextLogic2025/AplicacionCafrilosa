import React, { useEffect, useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { BRAND_COLORS } from '@cafrilosa/shared-types'
import { RouteService, RoutePlan } from '../../../services/api/RouteService'
import { ZoneService, Zone } from '../../../services/api/ZoneService'

interface Props {
    onSelectRoute: (zoneId: number, day: number) => void
}

export function SavedRoutesSummary({ onSelectRoute }: Props) {
    const [loading, setLoading] = useState(true)
    const [summary, setSummary] = useState<any[]>([])

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

    return (
        <ScrollView className="flex-1 bg-neutral-50 p-4">
            {summary.map((item) => (
                <View key={item.key} className="bg-white rounded-xl p-4 mb-3 border border-neutral-100 shadow-sm">
                    <View className="flex-row justify-between items-start">
                        <View>
                            <Text className="text-lg font-bold text-neutral-800">{item.zona_nombre}</Text>
                            <View className="flex-row items-center gap-2 mt-1">
                                <View className="bg-red-50 px-2 py-0.5 rounded text-xs border border-red-100">
                                    <Text className="text-red-700 font-bold text-xs">{getDayName(item.dia_semana)}</Text>
                                </View>
                                <Text className="text-neutral-500 text-xs">{item.count} Clientes</Text>
                            </View>
                        </View>

                        <View className="flex-row gap-2">
                            <TouchableOpacity
                                onPress={() => onSelectRoute(item.zona_id, item.dia_semana)}
                                className="bg-white border border-red-200 px-4 py-2 rounded-lg"
                            >
                                <Text className="text-red-600 font-bold text-sm">Ver / Editar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity className="bg-red-50 p-2 rounded-lg border border-red-100">
                                <Ionicons name="trash-outline" size={18} color={BRAND_COLORS.red} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            ))}
            <View className="h-20" />
        </ScrollView>
    )
}

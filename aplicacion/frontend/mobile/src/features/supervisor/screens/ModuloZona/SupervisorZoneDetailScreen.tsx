import React, { useEffect, useMemo, useState, useCallback } from 'react'
import { View, Text, TouchableOpacity, ScrollView } from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import { Header } from '../../../../components/ui/Header'
import { Zone, ZoneHelpers, ZoneEditState, ZoneService } from '../../../../services/api/ZoneService'
import { AssignmentService } from '../../../../services/api/AssignmentService'
import { UserService } from '../../../../services/api/UserService'
import { Ionicons } from '@expo/vector-icons'
import { BRAND_COLORS } from '../../../../shared/types'
import { MiniMapPreview } from '../../../../components/ui/MiniMapPreview'
import { ECUADOR_LOCATIONS } from '../../../../data/ecuadorLocations'

type ZoneWithVendor = Zone & { vendorName?: string }

export function SupervisorZoneDetailScreen() {
    const navigation = useNavigation<any>()
    const route = useRoute<any>()
    const zoneParam = route.params?.zone as ZoneWithVendor | null

    const [zone, setZone] = useState<ZoneWithVendor | null>(zoneParam)
    const [vendorName, setVendorName] = useState(zoneParam?.vendorName || 'Sin asignar')

    const polygon = useMemo(() => ZoneHelpers.parsePolygon(zone?.poligono_geografico), [zone])
    const cityMatch = useMemo(() => {
        if (!zone?.ciudad) return null
        const normalized = zone.ciudad.toLowerCase()
        for (const province of ECUADOR_LOCATIONS) {
            const match = province.cities.find(c => c.name.toLowerCase() === normalized)
            if (match) return { province: province.province, macro: province.macro, city: match }
        }
        return null
    }, [zone])

    const mapCenter = useMemo(() => {
        if (polygon.length > 0) return polygon[0]
        if (cityMatch) return { latitude: cityMatch.city.lat, longitude: cityMatch.city.lng }
        return null
    }, [polygon, cityMatch])

    const loadZone = useCallback(async () => {
        if (!zoneParam?.id) return
        try {
            const [allZones, assignments, vendors] = await Promise.all([
                ZoneService.getZones(),
                AssignmentService.getAssignmentsByZone(zoneParam.id),
                UserService.getVendors()
            ])
            const latest = allZones.find(z => z.id === zoneParam.id)
            if (latest) setZone(latest)
            const main = assignments.find(a => a.es_principal) || assignments[0]
            if (main) {
                const vendor = vendors.find(v => v.id === main.vendedor_usuario_id)
                if (vendor) setVendorName(vendor.name)
                else if (main.nombre_vendedor_cache) setVendorName(main.nombre_vendedor_cache)
            } else {
                setVendorName('Sin asignar')
            }
        } catch (err) {
            console.error(err)
        }
    }, [zoneParam?.id])

    useEffect(() => {
        loadZone()
    }, [loadZone])

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', loadZone)
        return unsubscribe
    }, [navigation, loadZone])

    const goToMap = () => {
        ZoneEditState.tempPolygon = null
        ZoneEditState.editingZoneId = null
        const nav = navigation as any
        nav?.navigate?.('SupervisorZoneMap', { mode: 'view', centerHint: mapCenter || undefined })
    }

    const goToEdit = () => {
        const nav = navigation as any
        nav?.navigate?.('SupervisorZoneForm', { zone })
    }

    return (
        <View className="flex-1 bg-neutral-50">
            <Header title="Detalle de Zona" variant="standard" onBackPress={() => navigation.goBack()} />

            <ScrollView className="flex-1 px-4 pt-4">
                <View className="bg-white p-5 rounded-2xl border border-neutral-100 mb-4 shadow-sm">
                    <Text className="text-neutral-500 text-xs font-bold mb-1 uppercase">Código</Text>
                    <Text className="text-neutral-900 text-xl font-bold mb-3">{zone?.codigo || 'Sin código'}</Text>

                    <Text className="text-neutral-500 text-xs font-bold mb-1 uppercase">Nombre</Text>
                    <Text className="text-neutral-900 text-lg font-semibold mb-3">{zone?.nombre || 'Sin nombre'}</Text>

                    <View className="flex-row gap-4 mb-3">
                        <View className="flex-1">
                            <Text className="text-neutral-500 text-xs font-bold mb-1 uppercase">Ciudad</Text>
                            <Text className="text-neutral-900 font-semibold">{zone?.ciudad || 'No asignada'}</Text>
                            {cityMatch?.province && (
                                <Text className="text-xs text-neutral-500 mt-1">Provincia: {cityMatch.province}</Text>
                            )}
                        </View>
                        <View className="flex-1">
                            <Text className="text-neutral-500 text-xs font-bold mb-1 uppercase">Macrorregión</Text>
                            <Text className="text-neutral-900 font-semibold">{zone?.macrorregion || cityMatch?.macro || 'N/D'}</Text>
                        </View>
                    </View>

                    <View className="mt-1">
                        <Text className="text-neutral-500 text-xs font-bold mb-1 uppercase">Vendedor</Text>
                        <Text className="text-neutral-900 font-semibold">{vendorName}</Text>
                    </View>

                    <View className="flex-row items-center justify-between mt-4">
                        <View className={`px-3 py-1.5 rounded-full ${zone?.activo ? 'bg-green-100' : 'bg-orange-100'}`}>
                            <Text className={`text-xs font-bold ${zone?.activo ? 'text-green-700' : 'text-orange-700'}`}>
                                {zone?.activo ? 'Activa' : 'Inactiva'}
                            </Text>
                        </View>
                        <TouchableOpacity
                            className="flex-row items-center bg-blue-50 border border-blue-200 px-3 py-2 rounded-xl"
                            onPress={goToEdit}
                        >
                            <Ionicons name="create-outline" size={18} color="#1E40AF" />
                            <Text className="text-blue-900 font-bold ml-2">Editar</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View className="bg-white p-5 rounded-2xl border border-neutral-100 shadow-sm">
                    <View className="flex-row items-center justify-between mb-3">
                        <Text className="text-neutral-900 font-bold text-lg">Mapa de Zona</Text>
                        <TouchableOpacity onPress={goToMap} className="flex-row items-center">
                            <Ionicons name="map" size={18} color={BRAND_COLORS.red} />
                            <Text className="ml-1 font-semibold" style={{ color: BRAND_COLORS.red }}>Abrir</Text>
                        </TouchableOpacity>
                    </View>
                    <MiniMapPreview polygon={polygon} center={mapCenter || undefined} onPress={goToMap} />
                    {polygon.length === 0 && (
                        <Text className="text-xs text-neutral-500 mt-2">Sin perímetro definido.</Text>
                    )}
                </View>

                <View className="h-10" />
            </ScrollView>
        </View>
    )
}

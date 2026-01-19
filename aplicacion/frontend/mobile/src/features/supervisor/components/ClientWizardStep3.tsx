import React, { useMemo, useState } from 'react'
import { View, Text, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native'
import MapView, { Marker, Polygon, PROVIDER_GOOGLE } from 'react-native-maps'
import { Ionicons } from '@expo/vector-icons'
import { BRAND_COLORS } from '../../../shared/types'
import { GenericModal } from '../../../components/ui/GenericModal'
import { GenericList } from '../../../components/ui/GenericList'
import { ZoneHelpers } from '../../../services/api/ZoneService'

interface Branch {
    id?: string
    tempId?: string
    nombre_sucursal: string
    direccion_entrega: string
    ubicacion_gps?: {
        type: 'Point'
        coordinates: [number, number]
    }
    contacto_nombre?: string
    contacto_telefono?: string
    zona_id?: number
}

interface Props {
    branches: Branch[]
    setBranches: (branches: Branch[]) => void
    onSubmit: () => void
    onBack: () => void
    loading: boolean
    zones: any[]
    clientData: any
    showNav?: boolean
}

export function ClientWizardStep3({ branches, setBranches, onSubmit, onBack, loading, zones, clientData, showNav = true }: Props) {
    const [showModal, setShowModal] = useState(false)
    const [showFullMap, setShowFullMap] = useState(false)
    const [editingBranch, setEditingBranch] = useState<Branch | null>(null)
    const [showZonePicker, setShowZonePicker] = useState(false)

    const [selectedBranchZoneId, setSelectedBranchZoneId] = useState<number | null>(clientData.zona_comercial_id || null)
    const selectedZone = useMemo(() => zones.find((z: any) => z.id === selectedBranchZoneId), [zones, selectedBranchZoneId])
    const zonePolygon = useMemo(() => selectedZone ? ZoneHelpers.parsePolygon(selectedZone.poligono_geografico) : [], [selectedZone])
    const clientLocation = clientData.ubicacion_gps ? {
        latitude: clientData.ubicacion_gps.coordinates[1],
        longitude: clientData.ubicacion_gps.coordinates[0]
    } : null

    const [tempForm, setTempForm] = useState<Branch>({
        nombre_sucursal: '',
        direccion_entrega: '',
        contacto_nombre: '',
        contacto_telefono: ''
    })

    const [mapRegion, setMapRegion] = useState({
        latitude: clientLocation?.latitude || -3.99313,
        longitude: clientLocation?.longitude || -79.20422,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05
    })

    const [fullMapKey, setFullMapKey] = useState(0)
    const [markerCoord, setMarkerCoord] = useState<{ latitude: number, longitude: number } | null>(null)

    const handleOpenFullMap = () => {
        setFullMapKey(Date.now())
        setShowFullMap(true)
    }

    const handleAdd = () => {
        setEditingBranch(null)
        setTempForm({
            nombre_sucursal: '',
            direccion_entrega: '',
            contacto_nombre: clientData.razon_social || '',
            contacto_telefono: ''
        })
        setSelectedBranchZoneId(clientData.zona_comercial_id || null)
        setMarkerCoord(clientLocation || null)
        if (clientLocation) {
            setMapRegion({
                latitude: clientLocation.latitude,
                longitude: clientLocation.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01
            })
        }
        setShowModal(true)
    }

    const getFullMapInitialRegion = () => {
        const startLat = markerCoord?.latitude || mapRegion.latitude
        const startLng = markerCoord?.longitude || mapRegion.longitude
        return {
            latitude: startLat,
            longitude: startLng,
            latitudeDelta: 0.002,
            longitudeDelta: 0.002
        }
    }

    const handleEdit = (branch: Branch) => {
        setEditingBranch(branch)
        setTempForm({ ...branch })
        setSelectedBranchZoneId(branch.zona_id || clientData.zona_comercial_id || null)
        if (branch.ubicacion_gps) {
            setMarkerCoord({
                longitude: branch.ubicacion_gps.coordinates[0],
                latitude: branch.ubicacion_gps.coordinates[1]
            })
            setMapRegion({
                latitude: branch.ubicacion_gps.coordinates[1],
                longitude: branch.ubicacion_gps.coordinates[0],
                latitudeDelta: 0.01,
                longitudeDelta: 0.01
            })
        }
        setShowModal(true)
    }

    const isPointInPolygon = (point: { latitude: number, longitude: number }, polygon: { latitude: number, longitude: number }[]) => {
        if (!polygon || polygon.length < 3) return true
        let inside = false
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            const xi = polygon[i].longitude, yi = polygon[i].latitude
            const xj = polygon[j].longitude, yj = polygon[j].latitude
            const intersect = ((yi > point.latitude) !== (yj > point.latitude)) &&
                (point.longitude < (xj - xi) * (point.latitude - yi) / (yj - yi + 0.0000001) + xi)
            if (intersect) inside = !inside
        }
        return inside
    }

    const handleSaveBranch = () => {
        if (!tempForm.nombre_sucursal.trim()) return
        if (!markerCoord) {
            Alert.alert('Ubicación requerida', 'Debes seleccionar una ubicación en el mapa.')
            return
        }
        if (!selectedBranchZoneId) {
            Alert.alert('Zona requerida', 'Debes seleccionar una zona para la sucursal.')
            return
        }
        if (zonePolygon.length > 0) {
            const inside = isPointInPolygon(markerCoord, zonePolygon)
            if (!inside) {
                Alert.alert('Ubicación fuera de la zona', 'La ubicación marcada debe estar dentro del polígono de la zona seleccionada.')
                return
            }
        }

        const newBranch: Branch = {
            ...tempForm,
            id: editingBranch?.id,
            tempId: editingBranch?.tempId || Date.now().toString(),
            zona_id: selectedBranchZoneId,
            ubicacion_gps: markerCoord ? {
                type: 'Point',
                coordinates: [markerCoord.longitude, markerCoord.latitude]
            } : undefined
        }

        if (editingBranch) {
            setBranches(branches.map(b => (b.tempId === editingBranch.tempId || b.id === editingBranch.id) ? newBranch : b))
        } else {
            setBranches([...branches, newBranch])
        }
        setShowModal(false)
    }

    const handleDelete = (idOrTempId: string) => {
        setBranches(branches.filter(b => b.tempId !== idOrTempId && b.id !== idOrTempId))
    }

    return (
        <View className="flex-1 bg-white">
            <View className="px-5 py-4 border-b border-neutral-100 flex-row justify-between items-center">
                <View>
                    <Text className="text-lg font-bold text-neutral-900">Sucursales Adicionales</Text>
                    <Text className="text-neutral-500 text-sm">(Opcional)</Text>
                </View>
                <TouchableOpacity
                    className="w-10 h-10 rounded-full bg-red-500 items-center justify-center shadow-md"
                    onPress={handleAdd}
                >
                    <Ionicons name="add" size={24} color="white" />
                </TouchableOpacity>
            </View>

            <View className="flex-1 px-4 pt-4">
                <GenericList
                    items={branches}
                    renderItem={(item: Branch) => {
                        const branchZone = zones.find((z: any) => z.id === item.zona_id)
                        return (
                            <View className="bg-white p-4 mb-3 rounded-2xl border border-neutral-100 shadow-sm flex-row items-center">
                                <View className="w-10 h-10 rounded-full bg-blue-50 items-center justify-center mr-3">
                                    <Ionicons name="storefront" size={20} color="#2563EB" />
                                </View>
                                <View className="flex-1">
                                    <Text className="font-bold text-neutral-900">{item.nombre_sucursal}</Text>
                                    <Text className="text-xs text-neutral-500" numberOfLines={1}>{item.direccion_entrega || 'Sin dirección'}</Text>
                                    {branchZone && (
                                        <View className="flex-row items-center mt-1">
                                            <View className="bg-indigo-100 px-2 py-0.5 rounded-full">
                                                <Text className="text-indigo-700 text-[10px] font-medium">Zona: {branchZone.nombre}</Text>
                                            </View>
                                        </View>
                                    )}
                                </View>

                                <TouchableOpacity onPress={() => handleEdit(item)} className="p-2">
                                    <Ionicons name="pencil" size={20} color="#4B5563" />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => (item.tempId || item.id) && handleDelete(item.tempId || item.id!)} className="p-2">
                                    <Ionicons name="trash-outline" size={20} color="#EF4444" />
                                </TouchableOpacity>
                            </View>
                        )
                    }}
                    onRefresh={() => { }}
                    isLoading={false}
                    emptyState={{
                        icon: 'storefront-outline',
                        title: 'Sin Sucursales',
                        message: 'No has agregado sucursales adicionales.'
                    }}
                />
            </View>

            {showNav && (
                <View className="p-5 border-t border-neutral-100 bg-white">
                    <TouchableOpacity
                        className={`w-full py-4 rounded-xl items-center shadow-lg ${loading ? 'opacity-70' : ''}`}
                        style={{ backgroundColor: BRAND_COLORS.red }}
                        onPress={onSubmit}
                        disabled={loading}
                    >
                        <Text className="text-white font-bold text-lg">
                            {loading ? 'Guardando...' : 'Finalizar y Guardar'}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        className="mt-4 py-2 items-center"
                        onPress={onBack}
                        disabled={loading}
                    >
                        <Text className="text-neutral-500 font-bold">Volver</Text>
                    </TouchableOpacity>
                </View>
            )}

            <GenericModal
                visible={showModal}
                title={editingBranch ? 'Editar Sucursal' : 'Nueva Sucursal'}
                onClose={() => setShowModal(false)}
            >
                <ScrollView className="max-h-[500px]">
                    <Text className="text-neutral-500 font-medium mb-1">Zona de la Sucursal</Text>
                    <TouchableOpacity
                        className="bg-neutral-50 border border-neutral-200 rounded-xl p-3 mb-3 flex-row justify-between items-center"
                        onPress={() => setShowZonePicker(true)}
                    >
                        <Text className="text-neutral-900">
                            {selectedZone?.nombre ? `${selectedZone.nombre}` : 'Selecciona una zona'}
                        </Text>
                        <Ionicons name="chevron-down" size={18} color="#6B7280" />
                    </TouchableOpacity>

                    <GenericModal
                        visible={showZonePicker}
                        title="Seleccionar Zona"
                        onClose={() => setShowZonePicker(false)}
                    >
                        <ScrollView className="max-h-96">
                            {zones && zones.length > 0 ? (
                                zones.map((z: any) => (
                                    <TouchableOpacity
                                        key={z.id}
                                        className={`p-4 border-b border-neutral-100 flex-row items-center justify-between ${selectedBranchZoneId === z.id ? 'bg-red-50' : ''}`}
                                        onPress={() => {
                                            setSelectedBranchZoneId(z.id)
                                            setShowZonePicker(false)
                                        }}
                                    >
                                        <View className="flex-row items-center flex-1">
                                            <View className="w-10 h-10 rounded-full bg-indigo-100 items-center justify-center mr-3">
                                                <Ionicons name="map" size={18} color="#4F46E5" />
                                            </View>
                                            <View className="flex-1">
                                                <Text className="text-neutral-900 font-semibold">{z.nombre}</Text>
                                                <Text className="text-neutral-500 text-xs">{z.codigo} • {z.ciudad || 'Sin ciudad'}</Text>
                                            </View>
                                        </View>
                                        {selectedBranchZoneId === z.id && (
                                            <Ionicons name="checkmark-circle" size={24} color="#EF4444" />
                                        )}
                                    </TouchableOpacity>
                                ))
                            ) : (
                                <View className="py-8 items-center">
                                    <Ionicons name="map-outline" size={40} color="#9CA3AF" />
                                    <Text className="text-neutral-500 mt-2">No hay zonas disponibles</Text>
                                </View>
                            )}
                        </ScrollView>
                    </GenericModal>

                    <Text className="text-neutral-500 font-medium mb-1">Nombre Sucursal</Text>
                    <TextInput
                        className="bg-neutral-50 border border-neutral-200 rounded-xl p-3 mb-3 text-neutral-900"
                        value={tempForm.nombre_sucursal}
                        onChangeText={t => setTempForm({ ...tempForm, nombre_sucursal: t })}
                        placeholder="Ej. Sucursal Centro"
                    />

                    <Text className="text-neutral-500 font-medium mb-1">Dirección Entrega</Text>
                    <TextInput
                        className="bg-neutral-50 border border-neutral-200 rounded-xl p-3 mb-3 text-neutral-900"
                        value={tempForm.direccion_entrega}
                        onChangeText={t => setTempForm({ ...tempForm, direccion_entrega: t })}
                        placeholder="Dirección exacta"
                    />

                    <View className="flex-row gap-3 mb-3">
                        <View className="flex-1">
                            <Text className="text-neutral-500 font-medium mb-1">Contacto Nombre</Text>
                            <TextInput
                                className="bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-neutral-900"
                                value={tempForm.contacto_nombre}
                                onChangeText={t => setTempForm({ ...tempForm, contacto_nombre: t })}
                                placeholder="Ej. Admin"
                            />
                        </View>
                        <View className="flex-1">
                            <Text className="text-neutral-500 font-medium mb-1">Teléfono</Text>
                            <TextInput
                                className="bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-neutral-900"
                                value={tempForm.contacto_telefono}
                                onChangeText={t => setTempForm({ ...tempForm, contacto_telefono: t })}
                                placeholder="Ej. 099..."
                                keyboardType="phone-pad"
                            />
                        </View>
                    </View>

                    <View className="flex-row justify-between items-center mb-2">
                        <Text className="text-neutral-500 font-medium">Ubicación GPS (Obligatorio)</Text>
                        <TouchableOpacity onPress={handleOpenFullMap}>
                            <Text className="text-blue-600 font-bold text-xs">Ampliar Mapa</Text>
                        </TouchableOpacity>
                    </View>
                    <View className="h-56 rounded-xl overflow-hidden mb-4 border border-neutral-200 relative bg-neutral-100">
                        <MapView
                            provider={PROVIDER_GOOGLE}
                            style={{ flex: 1 }}
                            region={mapRegion}
                            onRegionChangeComplete={setMapRegion}
                            onPress={(e) => setMarkerCoord(e.nativeEvent.coordinate)}
                        >
                            {zonePolygon.length > 0 && (
                                <Polygon
                                    coordinates={zonePolygon}
                                    strokeColor={BRAND_COLORS.red}
                                    fillColor="rgba(239, 68, 68, 0.1)"
                                    strokeWidth={1}
                                />
                            )}
                            {clientLocation && (
                                <Marker
                                    coordinate={clientLocation}
                                    title="Matriz (Cliente)"
                                    description="Ubicación principal"
                                    opacity={0.6}
                                >
                                    <Ionicons name="business" size={30} color="#4B5563" />
                                </Marker>
                            )}

                            {markerCoord && (
                                <Marker
                                    coordinate={markerCoord}
                                    draggable
                                    onDragEnd={(e) => setMarkerCoord(e.nativeEvent.coordinate)}
                                    title="Nueva Sucursal"
                                    pinColor={BRAND_COLORS.red}
                                />
                            )}
                        </MapView>

                        {!markerCoord && (
                            <View className="absolute bottom-4 left-0 right-0 items-center">
                                <View className="bg-black/60 px-3 py-1.5 rounded-full flex-row items-center backdrop-blur-sm">
                                    <Ionicons name="location-outline" size={14} color="white" />
                                    <Text className="text-white text-xs font-medium ml-1">Toca en el mapa para marcar</Text>
                                </View>
                            </View>
                        )}
                    </View>

                    <TouchableOpacity
                        className={`py-4 rounded-xl items-center shadow-md flex-row justify-center ${!tempForm.nombre_sucursal.trim() ? 'bg-neutral-300' : 'bg-red-600'}`}
                        style={tempForm.nombre_sucursal.trim() ? { backgroundColor: BRAND_COLORS.red } : {}}
                        onPress={handleSaveBranch}
                        disabled={!tempForm.nombre_sucursal.trim()}
                    >
                        <Ionicons name="save-outline" size={20} color="white" />
                        <Text className="text-white font-bold ml-2 text-base">Guardar Sucursal</Text>
                    </TouchableOpacity>
                </ScrollView>
            </GenericModal>

            <GenericModal
                visible={showFullMap}
                title="Seleccionar Ubicación Precisa"
                onClose={() => setShowFullMap(false)}
            >
                <View className="h-[600px] rounded-xl overflow-hidden relative bg-neutral-100">
                    <MapView
                        key={fullMapKey}
                        provider={PROVIDER_GOOGLE}
                        style={{ flex: 1 }}
                        initialRegion={getFullMapInitialRegion()}
                        onPress={(e) => setMarkerCoord(e.nativeEvent.coordinate)}
                    >
                        {zonePolygon.length > 0 && (
                            <Polygon coordinates={zonePolygon} strokeColor={BRAND_COLORS.red} fillColor="rgba(239, 68, 68, 0.1)" strokeWidth={1} />
                        )}
                        {clientLocation && (
                            <Marker coordinate={clientLocation} title="Matriz" opacity={0.6}>
                                <Ionicons name="business" size={30} color="#4B5563" />
                            </Marker>
                        )}
                        {markerCoord && (
                            <Marker
                                coordinate={markerCoord}
                                draggable
                                onDragEnd={(e) => setMarkerCoord(e.nativeEvent.coordinate)}
                                pinColor={BRAND_COLORS.red}
                            />
                        )}
                    </MapView>

                    <TouchableOpacity
                        className="absolute bottom-6 right-6 px-6 py-3 rounded-full shadow-lg flex-row items-center gap-2"
                        style={{ backgroundColor: '#2563EB' }}
                        onPress={() => setShowFullMap(false)}
                    >
                        <Ionicons name="checkmark-circle" size={20} color="white" />
                        <Text className="text-white font-bold text-base">Confirmar Ubicación</Text>
                    </TouchableOpacity>
                </View>
            </GenericModal>
        </View>
    )
}

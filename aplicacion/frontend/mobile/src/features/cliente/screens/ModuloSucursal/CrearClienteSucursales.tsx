import React, { useState, useEffect, useRef, useMemo } from 'react'
import { View, Text, TextInput, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import MapView, { Marker, Polygon, PROVIDER_GOOGLE } from 'react-native-maps'
import { BRAND_COLORS } from '../../../../shared/types'
import { ClientService, type CommercialZone } from '../../../../services/api/ClientService'
import { ZoneHelpers } from '../../../../services/api/ZoneService'
import { Header } from '../../../../components/ui/Header'
import { GenericModal } from '../../../../components/ui/GenericModal'
import { FeedbackModal, type FeedbackType } from '../../../../components/ui/FeedbackModal'

const DEFAULT_LAT = -3.99313
const DEFAULT_LNG = -79.20422
const DEFAULT_DELTA = 0.04

type RouteParams = {
    CrearClienteSucursales: {
        branchId?: string
    }
}

export function CrearClienteSucursalesScreen() {
    const navigation = useNavigation()
    const route = useRoute<RouteProp<RouteParams, 'CrearClienteSucursales'>>()
    const branchId = route.params?.branchId
    const isEditing = !!branchId

    const mapRef = useRef<MapView>(null)
    const [loading, setLoading] = useState(false)

    const [zones, setZones] = useState<CommercialZone[]>([])
    const [showZonePicker, setShowZonePicker] = useState(false)

    const [clientData, setClientData] = useState<any>(null)
    const [zone, setZone] = useState<CommercialZone | null>(null)

    const zonePolygon = useMemo(() => zone ? ZoneHelpers.parsePolygon(zone.poligono_geografico) : [], [zone])

    const [region, setRegion] = useState({
        latitude: DEFAULT_LAT,
        longitude: DEFAULT_LNG,
        latitudeDelta: DEFAULT_DELTA,
        longitudeDelta: DEFAULT_DELTA,
    })

    const [form, setForm] = useState({
        nombre_sucursal: '',
        direccion_entrega: '',
        contacto_nombre: '',
        contacto_telefono: '',
        latitud: DEFAULT_LAT,
        longitud: DEFAULT_LNG
    })

    const [modalVisible, setModalVisible] = useState(false)
    const [modalConfig, setModalConfig] = useState<{
        type: FeedbackType
        title: string
        message: string
        showCancel?: boolean
        onConfirm?: () => void
        confirmText?: string
        cancelText?: string
    }>({
        type: 'info',
        title: '',
        message: ''
    })

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        setLoading(true)
        try {
            const allZones = await ClientService.getCommercialZones(true) // silent=true
            setZones(allZones)

            const client = await ClientService.getMyClientData()

            if (client) {
                setClientData(client)

                if (isEditing) {
                    // --- EDIT MODE ---
                    const branch = await ClientService.getClientBranchById(branchId)
                    if (branch) {
                        setForm({
                            nombre_sucursal: branch.nombre_sucursal,
                            direccion_entrega: branch.direccion_entrega,
                            contacto_nombre: branch.contacto_nombre || '',
                            contacto_telefono: branch.contacto_telefono || '',
                            latitud: branch.ubicacion_gps?.coordinates[1] || DEFAULT_LAT,
                            longitud: branch.ubicacion_gps?.coordinates[0] || DEFAULT_LNG
                        })

                        setRegion({
                            latitude: branch.ubicacion_gps?.coordinates[1] || DEFAULT_LAT,
                            longitude: branch.ubicacion_gps?.coordinates[0] || DEFAULT_LNG,
                            latitudeDelta: 0.005,
                            longitudeDelta: 0.005
                        })

                        if (branch.zona_id) {
                            let assignedZone = allZones.find(z => z.id === branch.zona_id)
                            if (!assignedZone) {
                                assignedZone = await ClientService.getCommercialZoneById(branch.zona_id, true) || undefined
                            }
                            if (assignedZone) setZone(assignedZone)
                        }
                    }
                } else {
                    setForm(prev => ({
                        ...prev,
                        contacto_nombre: client.razon_social || '',
                        contacto_telefono: ''
                    }))

                    let initialZone: CommercialZone | undefined
                    if (client.zona_comercial_id) {
                        initialZone = allZones.find(z => z.id === client.zona_comercial_id)
                        if (!initialZone) {
                            try {
                                const specificZone = await ClientService.getCommercialZoneById(client.zona_comercial_id, true)
                                if (specificZone) {
                                    initialZone = specificZone
                                    setZones(prev => [...prev, specificZone])
                                }
                            } catch (e) { /* ignore */ }
                        }
                    }

                    if (initialZone) {
                        handleSelectZone(initialZone)
                    } else if (client.ubicacion_gps?.coordinates) {
                        const [lng, lat] = client.ubicacion_gps.coordinates
                        setRegion(prev => ({ ...prev, latitude: lat, longitude: lng }))
                        setForm(prev => ({ ...prev, latitud: lat, longitud: lng }))
                    }
                }
            }
        } catch (error) {
            console.error('Error loading data:', error)
            Alert.alert('Error', 'No se pudieron cargar los datos necesarios.')
        } finally {
            setLoading(false)
        }
    }

    const handleSelectZone = (selectedZone: CommercialZone) => {
        setZone(selectedZone)
        setShowZonePicker(false)

        const poly = ZoneHelpers.parsePolygon(selectedZone.poligono_geografico)
        if (poly.length > 0) {
            setRegion(prev => ({
                ...prev,
                latitude: poly[0].latitude,
                longitude: poly[0].longitude,
                latitudeDelta: DEFAULT_DELTA,
                longitudeDelta: DEFAULT_DELTA
            }))
            if (!isEditing) {
                setForm(prev => ({
                    ...prev,
                    latitud: poly[0].latitude,
                    longitud: poly[0].longitude
                }))
            }
        }
    }

    const isPointInPolygon = (point: { latitude: number, longitude: number }, polygon: { latitude: number, longitude: number }[]) => {
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

    const handleSubmit = async () => {
        if (!form.nombre_sucursal.trim()) {
            setModalConfig({
                type: 'warning',
                title: 'Campo Incompleto',
                message: 'El nombre de la sucursal es obligatorio. Por favor, ingrésalo.',
                showCancel: false,
                onConfirm: () => setModalVisible(false)
            })
            setModalVisible(true)
            return
        }
        if (!form.direccion_entrega.trim()) {
            setModalConfig({
                type: 'warning',
                title: 'Campo Incompleto',
                message: 'La dirección de entrega es obligatoria. Por favor, ingrésala.',
                showCancel: false,
                onConfirm: () => setModalVisible(false)
            })
            setModalVisible(true)
            return
        }

        if (zone && zonePolygon.length > 2) {
            const inside = isPointInPolygon({ latitude: form.latitud, longitude: form.longitud }, zonePolygon)
            if (!inside) {
                setModalConfig({
                    type: 'error',
                    title: 'Ubicación Fuera de Zona',
                    message: `La ubicación seleccionada debe estar dentro de la zona comercial "${zone.nombre}". Intenta mover el marcador.`,
                    showCancel: false,
                    onConfirm: () => setModalVisible(false)
                })
                setModalVisible(true)
                return
            }
        }

        setLoading(true)
        try {
            if (!clientData) throw new Error('Información de cliente no disponible')

            const ubicacion_gps = {
                type: 'Point',
                coordinates: [form.longitud, form.latitud]
            }

            const zonaIdToSave = zone?.id || clientData.zona_comercial_id

            if (!zonaIdToSave) {
                setModalConfig({
                    type: 'error',
                    title: 'Error de Zona',
                    message: 'No se ha podido determinar la zona comercial. Por favor contacta a soporte.',
                    showCancel: false,
                    onConfirm: () => setModalVisible(false)
                })
                setModalVisible(true)
                setLoading(false)
                return
            }

            if (isEditing) {
                await ClientService.updateClientBranch(branchId!, {
                    nombre_sucursal: form.nombre_sucursal,
                    direccion_entrega: form.direccion_entrega,
                    contacto_nombre: form.contacto_nombre,
                    contacto_telefono: form.contacto_telefono,
                    zona_id: zonaIdToSave,
                    ubicacion_gps: ubicacion_gps as any
                })

                setModalConfig({
                    type: 'success',
                    title: 'Sucursal Actualizada',
                    message: 'Los datos de la sucursal se han guardado correctamente.',
                    showCancel: false,
                    confirmText: 'Entendido',
                    onConfirm: () => {
                        setModalVisible(false)
                        navigation.goBack()
                    }
                })
                setModalVisible(true)
            } else {
                await ClientService.createClientBranch(clientData.id, {
                    cliente_id: clientData.id,
                    nombre_sucursal: form.nombre_sucursal,
                    direccion_entrega: form.direccion_entrega,
                    contacto_nombre: form.contacto_nombre,
                    contacto_telefono: form.contacto_telefono,
                    zona_id: zonaIdToSave,
                    activo: true,
                    ubicacion_gps: ubicacion_gps as any
                })

                setModalConfig({
                    type: 'success',
                    title: 'Sucursal Creada',
                    message: 'La nueva sucursal ha sido registrada exitosamente.',
                    showCancel: false,
                    confirmText: 'Entendido',
                    onConfirm: () => {
                        setModalVisible(false)
                        navigation.goBack()
                    }
                })
                setModalVisible(true)
            }
        } catch (error) {
            console.error(error)
            setModalConfig({
                type: 'error',
                title: 'Error',
                message: `No se pudo ${isEditing ? 'actualizar' : 'crear'} la sucursal. Por favor inténtalo de nuevo.`,
                showCancel: false,
                onConfirm: () => setModalVisible(false)
            })
            setModalVisible(true)
        } finally {
            setLoading(false)
        }
    }

    return (
        <View className="flex-1 bg-neutral-50">
            <Header title={isEditing ? "Editar Sucursal" : "Nueva Sucursal"} variant="standard" onBackPress={() => navigation.goBack()} />

            <ScrollView className="flex-1">
                <View className="h-80 w-full relative border-b border-neutral-200 bg-neutral-100">
                    <MapView
                        ref={mapRef}
                        provider={PROVIDER_GOOGLE}
                        style={{ width: '100%', height: '100%' }}
                        region={region}
                        onRegionChangeComplete={(r) => setRegion(r)}
                        onPress={(e) => {
                            setForm({
                                ...form,
                                latitud: e.nativeEvent.coordinate.latitude,
                                longitud: e.nativeEvent.coordinate.longitude
                            })
                        }}
                    >
                        {zonePolygon.length > 0 && (
                            <Polygon
                                coordinates={zonePolygon}
                                strokeColor={BRAND_COLORS.red}
                                fillColor="rgba(220, 38, 38, 0.1)"
                                strokeWidth={2}
                            />
                        )}

                        <Marker
                            coordinate={{ latitude: form.latitud, longitude: form.longitud }}
                            draggable
                            onDragEnd={(e) => {
                                setForm({
                                    ...form,
                                    latitud: e.nativeEvent.coordinate.latitude,
                                    longitud: e.nativeEvent.coordinate.longitude
                                })
                            }}
                            pinColor={BRAND_COLORS.red}
                            title={isEditing ? "Ubicación Sucursal" : "Nueva Sucursal"}
                        />

                        {clientData?.ubicacion_gps && (
                            <Marker
                                coordinate={{
                                    latitude: clientData.ubicacion_gps.coordinates[1],
                                    longitude: clientData.ubicacion_gps.coordinates[0]
                                }}
                                title="Matriz (Principal)"
                                opacity={0.6}
                            >
                                <Ionicons name="business" size={30} color="#4B5563" />
                            </Marker>
                        )}
                    </MapView>

                    <View className="absolute bottom-4 left-0 right-0 items-center pointer-events-none">
                        <View className="bg-black/60 px-3 py-1.5 rounded-full backdrop-blur-sm">
                            <Text className="text-white text-xs font-medium">Toque el mapa para ubicar la sucursal</Text>
                        </View>
                    </View>
                </View>

                <View className="p-4 space-y-4 pb-10">
                    <View className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex-row items-center">
                        <View className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center mr-3">
                            <Ionicons name="map" size={20} color="#2563EB" />
                        </View>
                        <View className="flex-1">
                            <Text className="text-blue-900 font-bold text-sm uppercase">Zona Comercial Asignada</Text>
                            <Text className="text-blue-700 text-sm mt-0.5">
                                {zone ? `${zone.nombre} (${zone.codigo})` : 'Cargando asignación...'}
                            </Text>
                        </View>
                        {!isEditing && (
                            <TouchableOpacity onPress={() => setShowZonePicker(true)} className="p-2">
                                <Ionicons name="chevron-down" size={20} color="#2563EB" />
                            </TouchableOpacity>
                        )}
                    </View>

                    {!zone && (
                        <Text className="text-xs text-orange-600 ml-1">
                            Es necesario tener una zona asignada para validar la ubicación.
                        </Text>
                    )}

                    <View className="bg-white p-5 rounded-2xl shadow-sm border border-neutral-100">
                        <Text className="text-lg font-bold text-neutral-900 mb-4">Datos de la Sucursal</Text>

                        <InputField
                            label="Nombre de Sucursal"
                            value={form.nombre_sucursal}
                            onChangeText={(t) => setForm({ ...form, nombre_sucursal: t })}
                            placeholder="Ej. Sucursal Norte"
                            iconName="storefront-outline"
                        />

                        <InputField
                            label="Dirección de Entrega"
                            value={form.direccion_entrega}
                            onChangeText={(t) => setForm({ ...form, direccion_entrega: t })}
                            placeholder="Ej. Av. Principal 123"
                            iconName="location-outline"
                        />

                        <View className="flex-row gap-3">
                            <View className="flex-1">
                                <InputField
                                    label="Contacto"
                                    value={form.contacto_nombre}
                                    onChangeText={(t) => setForm({ ...form, contacto_nombre: t })}
                                    placeholder="Nombre"
                                    iconName="person-outline"
                                />
                            </View>
                            <View className="flex-1">
                                <InputField
                                    label="Teléfono"
                                    value={form.contacto_telefono}
                                    onChangeText={(t) => setForm({ ...form, contacto_telefono: t })}
                                    placeholder="099..."
                                    keyboardType="phone-pad"
                                    iconName="call-outline"
                                />
                            </View>
                        </View>
                    </View>
                </View>
            </ScrollView>

            <View className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-neutral-100 shadow-lg">
                <TouchableOpacity
                    className={`bg-red-600 h-14 rounded-xl items-center justify-center shadow-md flex-row ${loading ? 'opacity-70' : ''}`}
                    onPress={handleSubmit}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <>
                            <Ionicons name="save-outline" size={20} color="white" style={{ marginRight: 8 }} />
                            <Text className="text-white font-bold text-lg">
                                {isEditing ? 'Guardar Cambios' : 'Crear Sucursal'}
                            </Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>

            <GenericModal
                visible={showZonePicker}
                title="Seleccionar Zona"
                onClose={() => setShowZonePicker(false)}
            >
                <ScrollView className="max-h-96">
                    {zones.length > 0 ? (
                        zones.map((z) => (
                            <TouchableOpacity
                                key={z.id}
                                className={`p-4 border-b border-neutral-100 flex-row items-center justify-between ${zone?.id === z.id ? 'bg-red-50' : ''}`}
                                onPress={() => handleSelectZone(z)}
                            >
                                <View className="flex-row items-center flex-1">
                                    <View className="w-10 h-10 rounded-full bg-indigo-50 items-center justify-center mr-3">
                                        <Ionicons name="map" size={18} color="#2563EB" />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-neutral-900 font-semibold">{z.nombre}</Text>
                                        <Text className="text-neutral-500 text-xs">{z.codigo} • {z.ciudad || 'Sin ciudad'}</Text>
                                    </View>
                                </View>
                                {zone?.id === z.id && (
                                    <Ionicons name="checkmark-circle" size={24} color={BRAND_COLORS.red} />
                                )}
                            </TouchableOpacity>
                        ))
                    ) : (
                        <View className="py-8 items-center">
                            <Ionicons name="alert-circle-outline" size={40} color="#9CA3AF" />
                            <Text className="text-neutral-500 mt-2">No se encontraron zonas comerciales</Text>
                        </View>
                    )}
                </ScrollView>
            </GenericModal>

            <FeedbackModal
                visible={modalVisible}
                type={modalConfig.type}
                title={modalConfig.title}
                message={modalConfig.message}
                onClose={() => setModalVisible(false)}
                showCancel={modalConfig.showCancel}
                onConfirm={modalConfig.onConfirm}
                confirmText={modalConfig.confirmText}
                cancelText={modalConfig.cancelText}
            />
        </View>
    )
}


interface InputFieldProps {
    label: string;
    value: string;
    onChangeText: (text: string) => void;
    placeholder: string;
    keyboardType?: 'default' | 'number-pad' | 'decimal-pad' | 'numeric' | 'email-address' | 'phone-pad';
    iconName: keyof typeof Ionicons.glyphMap;
}

const InputField = ({ label, value, onChangeText, placeholder, keyboardType = 'default', iconName }: InputFieldProps) => (
    <View className="mb-4">
        <Text className="text-neutral-500 font-medium text-xs mb-1.5 ml-1">{label} *</Text>
        <View className="flex-row items-center bg-neutral-50 border border-neutral-200 rounded-xl px-3 h-12 focus:border-red-500 focus:bg-white">
            <Ionicons name={iconName} size={18} color="#9CA3AF" />
            <TextInput
                className="flex-1 ml-3 text-neutral-900 font-medium"
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor="#D1D5DB"
                keyboardType={keyboardType}
            />
        </View>
    </View>
)

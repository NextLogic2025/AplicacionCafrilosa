import React, { useEffect, useMemo, useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import { Header } from '../../../../components/ui/Header'
import { Zone, ZoneService, ZoneHelpers, LatLng, ZoneEditState } from '../../../../services/api/ZoneService'
import { AssignmentService, Allocation } from '../../../../services/api/AssignmentService'
import { UserService, UserProfile } from '../../../../services/api/UserService'
import { GenericList } from '../../../../components/ui/GenericList'
import { GenericModal } from '../../../../components/ui/GenericModal'
import { Ionicons } from '@expo/vector-icons'
import { FeedbackModal, FeedbackType } from '../../../../components/ui/FeedbackModal'
import { ToggleSwitch } from '../../../../components/ui/ToggleSwitch'
import { BRAND_COLORS } from '../../../../shared/types'
import { ECUADOR_LOCATIONS, type EcuadorCity } from '../../../../data/ecuadorLocations'

const ZON_PREFIX = 'ZON-'

type ZoneFormParams = { zone?: Zone | null }
export function SupervisorZoneFormScreen() {
    const navigation = useNavigation<any>()
    const route = useRoute<any>()
    const initialZone = (route.params as ZoneFormParams | undefined)?.zone || null
    const isEditing = !!initialZone
    const [loading, setLoading] = useState(false)
    const [zoneData, setZoneData] = useState({
        nombre: initialZone?.nombre || '',
        codigoSuffix: initialZone?.codigo?.startsWith(ZON_PREFIX) ? initialZone.codigo.replace(ZON_PREFIX, '') : (initialZone?.codigo || ''),
        ciudad: initialZone?.ciudad || '',
        macrorregion: initialZone?.macrorregion || '',
        activo: initialZone?.activo ?? true,
    })

    const getFullCodigo = () => `${ZON_PREFIX}${zoneData.codigoSuffix}`
    const initialCityMatch = useMemo(() => {
        const name = initialZone?.ciudad?.toLowerCase()
        if (!name) return null
        for (const province of ECUADOR_LOCATIONS) {
            const match = province.cities.find(c => c.name.toLowerCase() === name)
            if (match) return { province: province.province, macro: province.macro, city: match }
        }
        return null
    }, [initialZone?.ciudad])
    const [selectedProvince, setSelectedProvince] = useState<string | null>(initialCityMatch?.province || null)
    const [selectedCity, setSelectedCity] = useState<EcuadorCity | null>(initialCityMatch?.city || null)
    const [cityCenter, setCityCenter] = useState<LatLng | null>(
        initialCityMatch ? { latitude: initialCityMatch.city.lat, longitude: initialCityMatch.city.lng } : null
    )
    const [polygon, setPolygon] = useState<LatLng[]>(
        initialZone?.poligono_geografico ? ZoneHelpers.parsePolygon(initialZone.poligono_geografico) : []
    )
    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            if (ZoneEditState.tempPolygon !== null) {
                setPolygon(ZoneEditState.tempPolygon)
                ZoneEditState.tempPolygon = null
            }
        })
        return unsubscribe
    }, [navigation])
    useEffect(() => {
        if (initialCityMatch && !zoneData.macrorregion) {
            setZoneData(prev => ({ ...prev, macrorregion: initialCityMatch.macro }))
        }
    }, [])
    const availableCities = useMemo(() => (!selectedProvince ? [] : (ECUADOR_LOCATIONS.find(p => p.province === selectedProvince)?.cities || [])), [selectedProvince])
    const [selectedVendor, setSelectedVendor] = useState<UserProfile | null>(null)
    const [currentAssignment, setCurrentAssignment] = useState<Allocation | null>(null)
    const [vendors, setVendors] = useState<UserProfile[]>([])
    const [showVendorModal, setShowVendorModal] = useState(false)
    const [showProvinceModal, setShowProvinceModal] = useState(false)
    const [showCityModal, setShowCityModal] = useState(false)
    const [assignedVendorsMap, setAssignedVendorsMap] = useState<Map<string, string>>(new Map())
    const [feedbackVisible, setFeedbackVisible] = useState(false)
    const [feedbackConfig, setFeedbackConfig] = useState<{ type: FeedbackType; title: string; message: string; onConfirm?: () => void }>({ type: 'info', title: '', message: '' })
    useEffect(() => {
        loadDependencies()
    }, [])
    const loadDependencies = async () => {
        setLoading(true)
        try {
            const [allVendors, allAssignments, allZones] = await Promise.all([
                UserService.getVendors(),
                AssignmentService.getAllAssignments(),
                ZoneService.getZones()
            ])
            setVendors(allVendors)
            const map = new Map<string, string>()
            allAssignments.forEach(a => {
                const isActive = (a.es_principal === true || String(a.es_principal) === 'true') && !a.fecha_fin && !a.deleted_at
                if (isActive) {
                    const z = allZones.find(z => z.id === Number(a.zona_id))
                    const zName = z ? z.nombre : `Zona #${a.zona_id}`
                    map.set(String(a.vendedor_usuario_id), zName)
                }
            })
            setAssignedVendorsMap(map)
            if (isEditing && initialZone?.id) {
                const [allocs] = await Promise.all([
                    AssignmentService.getAssignmentsByZone(initialZone.id)
                ])
                const main = allocs.find(a => a.es_principal) || allocs[0]
                if (main) {
                    setCurrentAssignment(main)
                    const foundVendor = allVendors.find(v => v.id === main.vendedor_usuario_id)
                    if (foundVendor) setSelectedVendor(foundVendor)
                }
            }
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }
    const showFeedback = (type: FeedbackType, title: string, message: string, onConfirm?: () => void) => {
        setFeedbackConfig({ type, title, message, onConfirm })
        setFeedbackVisible(true)
    }
    const handleSelectProvince = (provinceName: string) => {
        const province = ECUADOR_LOCATIONS.find(p => p.province === provinceName)
        setSelectedProvince(provinceName)
        setSelectedCity(null)
        setCityCenter(null)
        setZoneData(prev => ({
            ...prev,
            ciudad: '',
            macrorregion: province?.macro || prev.macrorregion
        }))
        setShowProvinceModal(false)
        if (province?.cities?.length) setTimeout(() => setShowCityModal(true), 120)
    }
    const handleSelectCity = (city: EcuadorCity) => {
        setSelectedCity(city)
        setZoneData(prev => ({ ...prev, ciudad: city.name }))
        setCityCenter({ latitude: city.lat, longitude: city.lng })
        setShowCityModal(false)
    }
    const handleSave = async () => {
        const nombre = zoneData.nombre.trim()
        const codigoSuffix = zoneData.codigoSuffix.trim()
        const fullCodigo = getFullCodigo()
        const ciudad = zoneData.ciudad.trim()
        if (!nombre || !codigoSuffix) {
            showFeedback('warning', 'Validación', 'El Nombre y el Código de Zona son obligatorios.')
            return
        }
        setLoading(true)
        try {
            let zoneId = initialZone?.id
            const zonePayload = {
                nombre,
                codigo: fullCodigo,
                ciudad: ciudad || undefined,
                macrorregion: zoneData.macrorregion.trim() || undefined,
                poligono_geografico: ZoneHelpers.toGeoJson(polygon),
                activo: zoneData.activo
            }
            if (isEditing && zoneId) {
                await ZoneService.updateZone(zoneId, zonePayload)
            } else {
                const createRes = await ZoneService.createZone(zonePayload)
                if (!createRes.success || !createRes.data) throw new Error(createRes.message || 'Error al crear la zona.')
                zoneId = createRes.data.id
            }
            if (!zoneId) throw new Error('No se pudo obtener el ID de la zona.')
            if (selectedVendor) {
                const isVendorChanged = !currentAssignment || currentAssignment.vendedor_usuario_id !== selectedVendor.id
                if (isVendorChanged) {
                    if (currentAssignment) await AssignmentService.removeAssignment(currentAssignment.id)
                    await AssignmentService.assignVendor({
                        zona_id: zoneId,
                        vendedor_usuario_id: selectedVendor.id,
                        es_principal: true,
                        nombre_vendedor_cache: selectedVendor.name
                    })
                }
            } else if (currentAssignment) {
                await AssignmentService.removeAssignment(currentAssignment.id)
            }
            const successTitle = isEditing ? 'Zona Actualizada' : 'Zona Creada'
            const successMsg = isEditing ? 'Cambios guardados correctamente.' : 'Zona creada con éxito.'
            showFeedback('success', successTitle, successMsg, () => navigation.goBack())
        } catch (error: any) {
            let msg = error.message || 'Error desconocido'
            if (msg.includes('500') || msg.includes('duplicad') || msg.includes('ya existe')) {
                msg = `Ya existe una zona con el código ${fullCodigo}. Usa otro código.`
            }
            showFeedback('error', 'Error', msg)
        } finally {
            setLoading(false)
        }
    }
    return (
        <View className="flex-1 bg-neutral-50">
            <Header title={isEditing ? 'Editar Zona' : 'Nueva Zona'} variant="standard" onBackPress={() => navigation.goBack()} />
            <ScrollView className="flex-1 px-4 pt-4">
                <View className={`bg-white p-5 rounded-2xl border mb-6 shadow-sm ${!zoneData.activo ? 'border-neutral-200 opacity-80' : 'border-neutral-100'}`}>
                    <Text className="text-neutral-500 text-xs font-bold mb-1 uppercase">Código de Zona</Text>
                    <View className="flex-row items-center bg-neutral-50 border border-neutral-200 rounded-xl overflow-hidden mb-1">
                        <View className="bg-neutral-200 px-4 py-4">
                            <Text className="text-base font-bold text-neutral-700">{ZON_PREFIX}</Text>
                        </View>
                        <TextInput
                            className="flex-1 px-4 py-4 text-neutral-900 text-base font-bold"
                            value={zoneData.codigoSuffix}
                            onChangeText={t => setZoneData(prev => ({ ...prev, codigoSuffix: t }))}
                            placeholder="UIO-N-01"
                            editable={zoneData.activo}
                            placeholderTextColor="#9CA3AF"
                            autoCapitalize="characters"
                        />
                    </View>
                    {zoneData.codigoSuffix ? (
                        <Text className="text-xs text-neutral-400 mb-4 ml-1">
                            Código completo: {getFullCodigo()}
                        </Text>
                    ) : (
                        <View className="mb-4" />
                    )}
                    <Text className="text-neutral-500 text-xs font-bold mb-1 uppercase">Nombre de Zona</Text>
                    <TextInput
                        className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 mb-4 text-neutral-900"
                        value={zoneData.nombre}
                        onChangeText={t => setZoneData(prev => ({ ...prev, nombre: t }))}
                        placeholder="EJ: Quito Norte"
                        editable={zoneData.activo}
                    />
                    <View className="mb-4">
                        <Text className="text-neutral-500 text-xs font-bold mb-1 uppercase">Provincia</Text>
                        <TouchableOpacity
                            className={`p-4 rounded-xl border ${selectedProvince ? 'bg-blue-50 border-blue-200' : 'bg-neutral-50 border-neutral-200'}`}
                            onPress={() => setShowProvinceModal(true)}
                            disabled={!zoneData.activo}
                        >
                            <View className="flex-row items-center justify-between">
                                <View className="flex-row items-center">
                                    <Ionicons name="flag-outline" size={18} color={selectedProvince ? '#1E40AF' : '#9CA3AF'} />
                                    <Text className={`ml-2 font-bold ${selectedProvince ? 'text-blue-900' : 'text-neutral-500'}`}>
                                        {selectedProvince || 'Seleccionar provincia'}
                                    </Text>
                                </View>
                                <Ionicons name="chevron-down" size={18} color={selectedProvince ? '#1E40AF' : '#9CA3AF'} />
                            </View>
                        </TouchableOpacity>
                    </View>
                    <View className="mb-4">
                        <Text className="text-neutral-500 text-xs font-bold mb-1 uppercase">Ciudad</Text>
                        <TouchableOpacity
                            className={`p-4 rounded-xl border ${zoneData.ciudad ? 'bg-blue-50 border-blue-200' : 'bg-neutral-50 border-neutral-200'} ${!selectedProvince ? 'opacity-60' : ''}`}
                            onPress={() => {
                                if (!selectedProvince) return
                                setShowCityModal(true)
                            }}
                            disabled={!zoneData.activo || !selectedProvince}
                        >
                            <View className="flex-row items-center justify-between">
                                <View className="flex-1">
                                    <View className="flex-row items-center">
                                        <Ionicons name="location-outline" size={18} color={zoneData.ciudad ? '#1E40AF' : '#9CA3AF'} />
                                        <Text className={`ml-2 font-bold ${zoneData.ciudad ? 'text-blue-900' : 'text-neutral-500'}`}>
                                            {zoneData.ciudad || 'Selecciona primero la provincia'}
                                        </Text>
                                    </View>
                                    {selectedCity && (
                                        <Text className="text-xs text-blue-600 mt-1">
                                            Lat: {selectedCity.lat.toFixed(3)}  Lng: {selectedCity.lng.toFixed(3)}
                                        </Text>
                                    )}
                                    {!selectedProvince && (
                                        <Text className="text-xs text-neutral-500 mt-1">
                                            Necesitas elegir provincia para listar ciudades.
                                        </Text>
                                    )}
                                    {!!zoneData.ciudad && !selectedCity && (
                                        <Text className="text-xs text-orange-600 mt-1">
                                            Ciudad manual (no encontrada en catálogo).
                                        </Text>
                                    )}
                                </View>
                                <Ionicons name="chevron-down" size={18} color={zoneData.ciudad ? '#1E40AF' : '#9CA3AF'} />
                            </View>
                        </TouchableOpacity>
                    </View>
                    <View className="mb-4">
                        <Text className="text-neutral-500 text-xs font-bold mb-1 uppercase">Macrorregión</Text>
                        <TextInput
                            className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 text-neutral-900"
                            value={zoneData.macrorregion}
                            onChangeText={t => setZoneData(prev => ({ ...prev, macrorregion: t }))}
                            placeholder="EJ: Sierra"
                            editable={zoneData.activo}
                        />
                    </View>
                    <View className="mb-4">
                        <Text className="text-neutral-500 text-xs font-bold mb-1 uppercase">Perímetro de Zona</Text>
                        <TouchableOpacity
                            className="bg-blue-50 border border-blue-200 p-4 rounded-xl flex-row items-center justify-between"
                            onPress={() => {
                                ZoneEditState.tempPolygon = polygon
                                ZoneEditState.editingZoneId = isEditing && initialZone?.id ? initialZone.id : null
                                const nav = navigation as any
                                nav?.navigate?.('SupervisorZoneMap', {
                                    mode: 'edit',
                                    centerHint: cityCenter || undefined,
                                })
                            }}
                            disabled={!zoneData.activo}
                        >
                            <View className="flex-row items-center">
                                <Ionicons name="map" size={20} color={zoneData.activo ? "#2563EB" : "#9CA3AF"} />
                                <Text className={`font-bold ml-2 ${zoneData.activo ? 'text-blue-900' : 'text-neutral-400'}`}>
                                    {polygon.length > 0 ? `Polígono Definido (${polygon.length} puntos)` : 'Dibujar en Mapa'}
                                </Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={zoneData.activo ? "#2563EB" : "#9CA3AF"} />
                        </TouchableOpacity>
                        {polygon.length > 0 && zoneData.activo && (
                            <TouchableOpacity
                                onPress={() => {
                                    if (!isEditing) {
                                        setPolygon([])
                                        return
                                    }
                                    Alert.alert(
                                        'Eliminar Perímetro',
                                        '¿Estás seguro de borrar el perímetro de la base de datos ahora mismo?',
                                        [
                                            { text: 'Cancelar', style: 'cancel' },
                                            {
                                                text: 'Eliminar',
                                                style: 'destructive',
                                                onPress: async () => {
                                                    setLoading(true)
                                                    try {
                                                        await ZoneService.updateZone(initialZone!.id, { poligono_geografico: null })
                                                        setPolygon([])
                                                        showFeedback('success', 'Eliminado', 'Perímetro eliminado correctamente.')
                                                    } catch (error) {
                                                        showFeedback('error', 'Error', 'No se pudo eliminar el perímetro.')
                                                    } finally {
                                                        setLoading(false)
                                                    }
                                                }
                                            }
                                        ]
                                    )
                                }}
                                className="mt-3 bg-red-100 py-3 rounded-xl items-center border border-red-200"
                            >
                                <View className="flex-row items-center">
                                    <Ionicons name="trash-outline" size={18} color="#DC2626" />
                                    <Text className="text-red-700 font-bold ml-2">Eliminar Perímetro</Text>
                                </View>
                            </TouchableOpacity>
                        )}
                    </View>
                    <View className="mt-2 border-t border-neutral-100 pt-4">
                        <View className="flex-row items-center mb-3">
                            <Ionicons name="person-circle-outline" size={22} color={BRAND_COLORS.red} />
                            <Text className="text-neutral-900 font-bold ml-2">Vendedor Responsable</Text>
                        </View>
                        <TouchableOpacity
                            className={`flex-row items-center justify-between p-4 rounded-xl border ${selectedVendor ? 'bg-blue-50 border-blue-200' : 'bg-neutral-50 border-neutral-200'}`}
                            onPress={() => setShowVendorModal(true)}
                            disabled={!zoneData.activo}
                        >
                            {selectedVendor ? (
                                <View className="flex-1">
                                    <Text className="text-blue-900 font-bold text-base">{selectedVendor.name}</Text>
                                    <Text className="text-blue-600 text-xs">{selectedVendor.email}</Text>
                                </View>
                            ) : (
                                <Text className="text-neutral-400 italic">Seleccionar Vendedor (Opcional)</Text>
                            )}
                            <Ionicons name="chevron-down" size={20} color={selectedVendor ? '#1E40AF' : '#9CA3AF'} />
                        </TouchableOpacity>
                    </View>
                </View>
                <View className="mb-6">
                    <Text className="text-neutral-900 font-bold text-lg mb-3">Configuración</Text>
                    <View className="bg-white p-4 rounded-2xl border border-neutral-100 flex-row items-center justify-between shadow-sm">
                        <View className="flex-row items-center flex-1 mr-4">
                            <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${zoneData.activo ? 'bg-green-100' : 'bg-orange-100'}`}>
                                <Ionicons name="power" size={20} color={zoneData.activo ? '#16A34A' : '#D97706'} />
                            </View>
                            <View>
                                <Text className="font-bold text-neutral-900 text-base">Estado de Zona</Text>
                                <Text className="text-neutral-500 text-xs">
                                    {zoneData.activo ? 'La zona está visible y activa' : 'La zona está oculta y desactivada'}
                                </Text>
                            </View>
                        </View>
                        <ToggleSwitch
                            checked={zoneData.activo}
                            onToggle={() => {
                                const newState = !zoneData.activo
                                showFeedback(
                                    'warning',
                                    `¿${newState ? 'Activar' : 'Desactivar'} zona?`,
                                    `¿Estás seguro de ${newState ? 'activar' : 'desactivar'} esta zona?`,
                                    () => setZoneData(prev => ({ ...prev, activo: newState }))
                                )
                            }}
                            colorOn="#22c55e"
                            colorOff="#d1d5db"
                        />
                    </View>
                </View>
                <TouchableOpacity
                    className={`w-full py-4 rounded-xl items-center shadow-lg mb-10 ${loading ? 'opacity-70' : ''}`}
                    style={{ backgroundColor: BRAND_COLORS.red }}
                    onPress={handleSave}
                    disabled={loading}
                >
                    <Text className="text-white font-bold text-lg">
                        {loading ? 'Guardando...' : (isEditing ? 'Guardar Cambios' : 'Crear Zona')}
                    </Text>
                </TouchableOpacity>
            </ScrollView>
            <GenericModal visible={showProvinceModal} title="Seleccionar Provincia" onClose={() => setShowProvinceModal(false)}>
                <View className="h-80">
                    <GenericList
                        items={ECUADOR_LOCATIONS}
                        isLoading={false}
                        onRefresh={() => { }}
                        renderItem={(item) => {
                            const isSelected = item.province === selectedProvince
                            return (
                                <TouchableOpacity
                                    className={`p-3 mb-2 rounded-xl flex-row items-center justify-between border ${isSelected ? 'bg-blue-50 border-blue-200' : 'bg-white border-neutral-100'}`}
                                    onPress={() => handleSelectProvince(item.province)}
                                >
                                    <View>
                                        <Text className={`font-bold ${isSelected ? 'text-blue-900' : 'text-neutral-800'}`}>{item.province}</Text>
                                        <Text className="text-xs text-neutral-500">Macrorregión: {item.macro}</Text>
                                    </View>
                                    {isSelected && <Ionicons name="checkmark-circle" size={22} color="#2563EB" />}
                                </TouchableOpacity>
                            )
                        }}
                        emptyState={{ icon: 'map', title: 'Sin provincias', message: 'No se encontraron provincias en el catálogo.' }}
                    />
                </View>
            </GenericModal>
            <GenericModal
                visible={showCityModal}
                title={selectedProvince ? `Ciudad de ${selectedProvince}` : 'Ciudad'}
                onClose={() => setShowCityModal(false)}
            >
                <View className="h-80">
                    <GenericList
                        items={availableCities}
                        isLoading={false}
                        onRefresh={() => { }}
                        renderItem={(city: EcuadorCity) => {
                            const isSelected = selectedCity?.name === city.name
                            return (
                                <TouchableOpacity
                                    className={`p-3 mb-2 rounded-xl flex-row items-center justify-between border ${isSelected ? 'bg-blue-50 border-blue-200' : 'bg-white border-neutral-100'}`}
                                    onPress={() => handleSelectCity(city)}
                                >
                                    <View>
                                        <Text className={`font-bold ${isSelected ? 'text-blue-900' : 'text-neutral-800'}`}>{city.name}</Text>
                                        <Text className="text-xs text-neutral-500">Lat {city.lat.toFixed(3)} · Lng {city.lng.toFixed(3)}</Text>
                                    </View>
                                    {isSelected && <Ionicons name="checkmark-circle" size={22} color="#2563EB" />}
                                </TouchableOpacity>
                            )
                        }}
                        emptyState={{
                            icon: 'location',
                            title: selectedProvince ? 'Sin ciudades' : 'Elige provincia',
                            message: selectedProvince ? 'No hay ciudades configuradas para esta provincia.' : 'Selecciona primero una provincia.'
                        }}
                    />
                </View>
            </GenericModal>
            <GenericModal visible={showVendorModal} title="Seleccionar Vendedor" onClose={() => setShowVendorModal(false)}>
                <View className="h-80">
                    <GenericList
                        items={vendors}
                        isLoading={false}
                        onRefresh={() => { }}
                        renderItem={(item: UserProfile) => {
                            const isSelected = selectedVendor?.id === item.id
                            const assignedZoneName = assignedVendorsMap.get(String(item.id))
                            const isAssignedToOther = !!assignedZoneName && (!currentAssignment || String(currentAssignment.vendedor_usuario_id) !== String(item.id))
                            return (
                                <TouchableOpacity
                                    className={`p-3 mb-2 rounded-xl flex-row items-center justify-between border ${isSelected ? 'bg-blue-50 border-blue-200' : 'bg-white border-neutral-100'} ${isAssignedToOther ? 'opacity-60 bg-gray-50' : ''}`}
                                    onPress={() => {
                                        if (isAssignedToOther) {
                                            showFeedback('warning', 'Vendedor Ya Asignado', `Este vendedor ya pertenece a la zona: ${assignedZoneName}`)
                                            return
                                        }
                                        setSelectedVendor(item)
                                        setShowVendorModal(false)
                                    }}
                                >
                                    <View className="flex-row items-center flex-1">
                                        <View className={`w-10 h-10 rounded-full mr-3 items-center justify-center ${isSelected ? 'bg-blue-100' : (isAssignedToOther ? 'bg-gray-200' : 'bg-neutral-100')}`}>
                                            <Text className={`${isSelected ? 'text-blue-600' : 'text-neutral-500'} font-bold`}>{item.name.charAt(0)}</Text>
                                        </View>
                                        <View>
                                            <Text className={`font-bold ${isSelected ? 'text-blue-900' : (isAssignedToOther ? 'text-gray-500' : 'text-neutral-800')}`}>{item.name}</Text>
                                            <Text className="text-xs text-neutral-500">{item.email}</Text>
                                            {isAssignedToOther && (
                                                <Text className="text-xs text-orange-600 font-bold mt-0.5">Asignado a: {assignedZoneName}</Text>
                                            )}
                                        </View>
                                    </View>
                                    {isSelected && <Ionicons name="checkmark-circle" size={24} color="#2563EB" />}
                                </TouchableOpacity>
                            )
                        }}
                        emptyState={{ icon: 'people', title: 'Sin Vendedores', message: 'No se encontraron vendedores disponibles.' }}
                    />
                </View>
            </GenericModal>
            <FeedbackModal
                visible={feedbackVisible}
                type={feedbackConfig.type}
                title={feedbackConfig.title}
                message={feedbackConfig.message}
                onClose={() => setFeedbackVisible(false)}
                onConfirm={feedbackConfig.onConfirm}
            />
        </View>
    )
}

import React, { useState, useMemo, useCallback } from 'react'
import { 
    View, 
    Text, 
    ScrollView, 
    TouchableOpacity, 
    ActivityIndicator,
    Modal,
    SafeAreaView,
    Alert
} from 'react-native'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, Region } from 'react-native-maps'
import { Header } from '../../../../components/ui/Header'
import { GenericModal } from '../../../../components/ui/GenericModal'
import { FeedbackModal, FeedbackType } from '../../../../components/ui/FeedbackModal'
import { StatusBadge } from '../../../../components/ui/StatusBadge'
import { BRAND_COLORS } from '../../../../shared/types'
import { Zone } from '../../../../services/api/ZoneService'
import { RouteService, RoutePlan } from '../../../../services/api/RouteService'
import { RouteDestination } from './SupervisorRouteCreateScreen'

// ============ CONSTANTES ============
const DAYS = [
    { id: 1, label: 'Lunes', short: 'L' },
    { id: 2, label: 'Martes', short: 'M' },
    { id: 3, label: 'Miércoles', short: 'Mi' },
    { id: 4, label: 'Jueves', short: 'J' },
    { id: 5, label: 'Viernes', short: 'V' },
] as const

const FREQUENCIES = [
    { id: 'SEMANAL', label: 'Semanal', icon: 'calendar' as const },
    { id: 'QUINCENAL', label: 'Quincenal', icon: 'calendar-outline' as const },
    { id: 'MENSUAL', label: 'Mensual', icon: 'calendar-clear-outline' as const },
] as const

const PRIORITIES = [
    { id: 'ALTA', label: 'Alta', color: '#EF4444', icon: 'alert-circle' as const, order: 1 },
    { id: 'MEDIA', label: 'Media', color: '#F59E0B', icon: 'time' as const, order: 2 },
    { id: 'BAJA', label: 'Baja', color: '#22C55E', icon: 'checkmark-circle' as const, order: 3 },
] as const

// Horas disponibles para el selector de tiempo
const AVAILABLE_HOURS = [
    '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
    '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
    '18:00', '18:30', '19:00', '19:30', '20:00'
] as const

const DEFAULT_REGION: Region = {
    latitude: -3.99313,
    longitude: -79.20422,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05
}

type FrequencyType = 'SEMANAL' | 'QUINCENAL' | 'MENSUAL'
type PriorityType = 'ALTA' | 'MEDIA' | 'BAJA'

// Configuración individual por destino
interface DestinationConfig {
    destino: RouteDestination
    hora: string
    prioridad: PriorityType
    frecuencia: FrequencyType  // Frecuencia individual por destino
}

type RouteParams = {
    SupervisorRouteCreatePaso2: {
        zone: Zone
        destinations: RouteDestination[]
        existingRoutes: RoutePlan[]
    }
}

// ============ PASO 2: CONFIGURACIÓN DE LA RUTA ============
export function SupervisorRouteCreateScreenPaso2() {
    const navigation = useNavigation<any>()
    const route = useRoute<RouteProp<RouteParams, 'SupervisorRouteCreatePaso2'>>()
    
    const { zone, destinations, existingRoutes } = route.params

    // Configuración individual por destino
    const [destinationConfigs, setDestinationConfigs] = useState<DestinationConfig[]>(() => 
        destinations.map((dest, index) => ({
            destino: dest,
            hora: '',
            prioridad: 'MEDIA' as PriorityType,
            frecuencia: 'SEMANAL' as FrequencyType  // Frecuencia por defecto
        }))
    )
    
    // Form State (configuración global)
    const [selectedDays, setSelectedDays] = useState<number[]>([])
    
    // UI State
    const [loading, setLoading] = useState(false)
    const [showFullscreenMap, setShowFullscreenMap] = useState(false)
    const [showTimePicker, setShowTimePicker] = useState(false)
    const [editingDestIndex, setEditingDestIndex] = useState<number | null>(null)
    const [showPriorityPicker, setShowPriorityPicker] = useState(false)
    const [showFrequencyPicker, setShowFrequencyPicker] = useState(false)
    
    // Feedback
    const [feedbackModal, setFeedbackModal] = useState<{
        visible: boolean
        type: FeedbackType
        title: string
        message: string
        onConfirm?: () => void
    }>({ visible: false, type: 'info', title: '', message: '' })

    // ============ COMPUTED ============
    // Ordenar destinos automáticamente: primero por prioridad, luego por hora
    const sortedConfigs = useMemo(() => {
        return [...destinationConfigs].sort((a, b) => {
            // 1. Ordenar por prioridad (ALTA=1, MEDIA=2, BAJA=3)
            const prioA = PRIORITIES.find(p => p.id === a.prioridad)?.order || 2
            const prioB = PRIORITIES.find(p => p.id === b.prioridad)?.order || 2
            if (prioA !== prioB) return prioA - prioB
            
            // 2. Si misma prioridad, ordenar por hora
            if (a.hora && b.hora) {
                return a.hora.localeCompare(b.hora)
            }
            // Los que tienen hora van primero
            if (a.hora && !b.hora) return -1
            if (!a.hora && b.hora) return 1
            
            return 0
        })
    }, [destinationConfigs])

    const destinationsWithLocation = useMemo(() => {
        return sortedConfigs.filter(c => c.destino.location != null)
    }, [sortedConfigs])

    const mapRegion = useMemo<Region>(() => {
        if (destinationsWithLocation.length === 0) return DEFAULT_REGION
        
        if (destinationsWithLocation.length === 1) {
            return {
                latitude: destinationsWithLocation[0].destino.location!.latitude,
                longitude: destinationsWithLocation[0].destino.location!.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01
            }
        }

        const lats = destinationsWithLocation.map(d => d.destino.location!.latitude)
        const lngs = destinationsWithLocation.map(d => d.destino.location!.longitude)
        return {
            latitude: (Math.min(...lats) + Math.max(...lats)) / 2,
            longitude: (Math.min(...lngs) + Math.max(...lngs)) / 2,
            latitudeDelta: Math.max(0.01, (Math.max(...lats) - Math.min(...lats)) * 1.5),
            longitudeDelta: Math.max(0.01, (Math.max(...lngs) - Math.min(...lngs)) * 1.5)
        }
    }, [destinationsWithLocation])

    // Polyline path para mostrar la ruta
    const routePath = useMemo(() => {
        return destinationsWithLocation
            .filter(c => c.destino.location)
            .map(c => c.destino.location!)
    }, [destinationsWithLocation])

    const totalRoutes = destinationConfigs.length * selectedDays.length

    // Verificar conflictos
    const isDestinationInRoute = useCallback((clientId: string, dayId: number) => {
        return existingRoutes.some(r => 
            r.cliente_id === clientId && 
            r.dia_semana === dayId &&
            r.activo
        )
    }, [existingRoutes])

    // Helper para obtener color de prioridad
    const getPriorityColor = (prio: PriorityType) => {
        return PRIORITIES.find(p => p.id === prio)?.color || '#F59E0B'
    }

    // ============ ACTIONS ============
    const toggleDay = useCallback((dayId: number) => {
        setSelectedDays(prev => 
            prev.includes(dayId) 
                ? prev.filter(d => d !== dayId)
                : [...prev, dayId]
        )
    }, [])

    const updateDestinationHora = useCallback((index: number, hora: string) => {
        setDestinationConfigs(prev => {
            const updated = [...prev]
            updated[index] = { ...updated[index], hora }
            return updated
        })
    }, [])

    const updateDestinationPrioridad = useCallback((index: number, prioridad: PriorityType) => {
        setDestinationConfigs(prev => {
            const updated = [...prev]
            updated[index] = { ...updated[index], prioridad }
            return updated
        })
    }, [])

    const updateDestinationFrecuencia = useCallback((index: number, frecuencia: FrequencyType) => {
        setDestinationConfigs(prev => {
            const updated = [...prev]
            updated[index] = { ...updated[index], frecuencia }
            return updated
        })
    }, [])

    const removeDestination = useCallback((index: number) => {
        if (destinationConfigs.length <= 1) {
            Alert.alert('Mínimo requerido', 'Debe haber al menos un destino en la ruta.')
            return
        }
        Alert.alert(
            'Eliminar destino',
            `¿Quitar "${destinationConfigs[index].destino.name}" de la ruta?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                { 
                    text: 'Eliminar', 
                    style: 'destructive',
                    onPress: () => {
                        setDestinationConfigs(prev => prev.filter((_, i) => i !== index))
                    }
                }
            ]
        )
    }, [destinationConfigs])

    const handleAddMoreDestinations = () => {
        // Volver al paso 1 para agregar más destinos
        navigation.goBack()
    }

    const handleSave = async () => {
        if (selectedDays.length === 0) {
            setFeedbackModal({
                visible: true,
                type: 'warning',
                title: 'Selecciona días',
                message: 'Debes seleccionar al menos un día de visita.'
            })
            return
        }

        // Verificar que todos tengan hora asignada
        const sinHora = sortedConfigs.filter(c => !c.hora)
        if (sinHora.length > 0) {
            setFeedbackModal({
                visible: true,
                type: 'warning',
                title: 'Hora requerida',
                message: `${sinHora.length} destino(s) no tienen hora asignada. Asigna una hora a cada visita.`
            })
            return
        }

        // Validar horas duplicadas dentro de los destinos seleccionados
        const horasDuplicadas: string[] = []
        const horasUsadas = new Map<string, string[]>() // hora -> [nombres de destinos]
        
        sortedConfigs.forEach(config => {
            const horaKey = config.hora
            if (!horasUsadas.has(horaKey)) {
                horasUsadas.set(horaKey, [])
            }
            horasUsadas.get(horaKey)!.push(config.destino.name)
        })
        
        horasUsadas.forEach((destinos, hora) => {
            if (destinos.length > 1) {
                horasDuplicadas.push(`${hora}: ${destinos.join(', ')}`)
            }
        })
        
        if (horasDuplicadas.length > 0) {
            setFeedbackModal({
                visible: true,
                type: 'warning',
                title: 'Horas duplicadas',
                message: `No puedes asignar la misma hora a múltiples destinos:\n\n${horasDuplicadas.slice(0, 3).join('\n')}`
            })
            return
        }

        // Verificar conflictos con rutas existentes (mismo cliente + mismo día + misma hora)
        const conflicts: string[] = []
        const duplicateRoutes: string[] = []
        
        sortedConfigs.forEach(config => {
            selectedDays.forEach(day => {
                // Verificar si ya existe una ruta EXACTA para este cliente/sucursal en este día
                const existingRoute = existingRoutes.find(r => {
                    const sameClient = r.cliente_id === config.destino.clientId
                    const sameDay = r.dia_semana === day
                    const isActive = r.activo
                    // Si es sucursal, verificar que sea la misma sucursal
                    const sameBranch = config.destino.type === 'branch' 
                        ? r.sucursal_id === config.destino.id 
                        : !r.sucursal_id // Si no es sucursal, verificar que no tenga sucursal_id
                    
                    return sameClient && sameDay && isActive && sameBranch
                })
                
                if (existingRoute) {
                    const dayLabel = DAYS.find(d => d.id === day)?.label || ''
                    // Ruta duplicada exacta
                    duplicateRoutes.push(`${config.destino.name} - ${dayLabel}`)
                }
            })
        })

        if (duplicateRoutes.length > 0) {
            setFeedbackModal({
                visible: true,
                type: 'warning',
                title: 'Ruta ya existe',
                message: `Las siguientes rutas ya están creadas:\n\n${duplicateRoutes.slice(0, 5).join('\n')}${duplicateRoutes.length > 5 ? `\n... y ${duplicateRoutes.length - 5} más` : ''}\n\nElimina los destinos duplicados o selecciona otros días.`
            })
            return
        }

        setLoading(true)
        try {
            const results: { success: boolean, name: string, day: string, error?: string }[] = []
            
            // Crear rutas una por una para mejor manejo de errores
            for (const config of sortedConfigs) {
                for (const day of selectedDays) {
                    const dayLabel = DAYS.find(d => d.id === day)?.label || ''
                    
                    try {
                        // Doble verificación antes de crear (por si cambió algo mientras tanto)
                        const existingCheck = await RouteService.checkDuplicate(
                            config.destino.clientId,
                            day,
                            undefined, // No verificar hora, solo cliente + día
                            config.destino.type === 'branch' ? config.destino.id : undefined
                        )
                        
                        if (existingCheck) {
                            results.push({ 
                                success: false, 
                                name: config.destino.name, 
                                day: dayLabel, 
                                error: 'Ya existe' 
                            })
                            continue
                        }
                        
                        const payload: Partial<RoutePlan> = {
                            cliente_id: config.destino.clientId,
                            sucursal_id: config.destino.type === 'branch' ? config.destino.id : undefined,
                            zona_id: config.destino.zoneId,
                            dia_semana: day,
                            frecuencia: config.frecuencia,
                            prioridad_visita: config.prioridad,
                            orden_sugerido: sortedConfigs.indexOf(config) + 1,
                            activo: true,
                            hora_estimada_arribo: config.hora || undefined
                        }
                        
                        await RouteService.create(payload)
                        results.push({ success: true, name: config.destino.name, day: dayLabel })
                    } catch (err: any) {
                        console.error(`Error creating route for ${config.destino.name}:`, err)
                        results.push({ 
                            success: false, 
                            name: config.destino.name, 
                            day: dayLabel, 
                            error: err.message?.includes('500') ? 'Ruta ya existe' : err.message 
                        })
                    }
                }
            }
            
            const successCount = results.filter(r => r.success).length
            const failedCount = results.filter(r => !r.success).length
            
            if (failedCount > 0 && successCount === 0) {
                // Todas fallaron
                const failedList = results.filter(r => !r.success).slice(0, 3)
                setFeedbackModal({
                    visible: true,
                    type: 'error',
                    title: 'No se crearon rutas',
                    message: `Todas las rutas ya existen o hubo errores:\n\n${failedList.map(f => `• ${f.name} (${f.day}): ${f.error}`).join('\n')}`
                })
            } else if (failedCount > 0) {
                // Algunas fallaron
                setFeedbackModal({
                    visible: true,
                    type: 'warning',
                    title: 'Rutas parcialmente creadas',
                    message: `Se crearon ${successCount} ruta(s).\n${failedCount} ruta(s) no se crearon porque ya existían.`,
                    onConfirm: () => {
                        navigation.reset({
                            index: 0,
                            routes: [{ name: 'SupervisorRoutes' }]
                        })
                    }
                })
            } else {
                // Todas exitosas
                setFeedbackModal({
                    visible: true,
                    type: 'success',
                    title: '¡Rutas Creadas!',
                    message: `Se crearon ${successCount} ruta(s) para ${sortedConfigs.length} destino(s).`,
                    onConfirm: () => {
                        navigation.reset({
                            index: 0,
                            routes: [{ name: 'SupervisorRoutes' }]
                        })
                    }
                })
            }
        } catch (error: any) {
            console.error('Error creating routes:', error)
            setFeedbackModal({
                visible: true,
                type: 'error',
                title: 'Error',
                message: error.message || 'No se pudieron crear las rutas'
            })
        } finally {
            setLoading(false)
        }
    }

    // ============ RENDER ============
    return (
        <View className="flex-1 bg-neutral-50">
            <Header 
                title="Nueva Ruta" 
                variant="standard" 
                onBackPress={() => navigation.reset({
                    index: 0,
                    routes: [{ name: 'SupervisorRoutes' }]
                })} 
            />

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                <View className="p-5">
                    
                    {/* Indicador de pasos con descripción */}
                    <View className="bg-white rounded-2xl p-4 mb-6 border border-neutral-100">
                        <View className="flex-row items-center justify-center mb-3">
                            <View className="items-center">
                                <View className="w-10 h-10 rounded-full bg-green-500 items-center justify-center">
                                    <Ionicons name="checkmark" size={20} color="white" />
                                </View>
                                <Text className="text-green-600 text-xs font-medium mt-1">Zona ✓</Text>
                            </View>
                            <View className="w-12 h-1 bg-red-500 mx-3" />
                            <View className="items-center">
                                <View className="w-10 h-10 rounded-full bg-red-500 items-center justify-center">
                                    <Text className="text-white font-bold">2</Text>
                                </View>
                                <Text className="text-red-600 text-xs font-medium mt-1">Horario</Text>
                            </View>
                        </View>
                        <Text className="text-center text-neutral-600 text-sm">
                            Configura los días, frecuencia y prioridad de visita
                        </Text>
                    </View>

                    {/* Resumen de selección del paso 1 + Botón agregar más */}
                    <View className="bg-gradient-to-r from-indigo-50 to-blue-50 p-4 rounded-2xl border border-indigo-100 mb-6">
                        <View className="flex-row items-center justify-between mb-2">
                            <Text className="text-indigo-700 text-xs uppercase font-bold">✅ Paso 1 Completado</Text>
                            <View className="flex-row items-center gap-2">
                                <TouchableOpacity 
                                    onPress={handleAddMoreDestinations}
                                    className="bg-blue-500 px-3 py-1.5 rounded-full flex-row items-center"
                                >
                                    <Ionicons name="add" size={14} color="white" />
                                    <Text className="text-white text-xs font-bold ml-1">Agregar más</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                        <View className="flex-row items-center mb-2">
                            <Ionicons name="map" size={16} color="#4F46E5" />
                            <Text className="text-neutral-900 font-medium ml-2">Zona: {zone.nombre}</Text>
                        </View>
                        <View className="flex-row items-center">
                            <Ionicons name="business" size={16} color="#3B82F6" />
                            <Text className="text-neutral-900 font-medium ml-2">{destinationConfigs.length} destino(s) a visitar</Text>
                        </View>
                    </View>

                    {/* ============ LISTA DE DESTINOS CON HORA Y PRIORIDAD INDIVIDUAL ============ */}
                    <View className="mb-6">
                        <View className="flex-row items-center justify-between mb-3">
                            <Text className="text-lg font-bold text-neutral-900">
                                <Text className="text-red-500">📍</Text> Configurar Destinos
                            </Text>
                            <View className="bg-blue-100 px-2 py-1 rounded-full">
                                <Text className="text-blue-700 text-[10px] font-bold">
                                    Orden automático ✓
                                </Text>
                            </View>
                        </View>
                        <Text className="text-neutral-500 text-xs mb-3">
                            💡 Asigna hora y prioridad a cada destino. Se ordenan automáticamente.
                        </Text>
                        
                        {/* Lista de destinos ordenados */}
                        {sortedConfigs.map((config, displayIndex) => {
                            // Encontrar el índice original para editar
                            const originalIndex = destinationConfigs.findIndex(c => c.destino.id === config.destino.id)
                            const priorityInfo = PRIORITIES.find(p => p.id === config.prioridad)
                            const isOtherZone = config.destino.zoneId !== zone.id
                            
                            return (
                                <View 
                                    key={config.destino.id} 
                                    className="bg-white rounded-2xl mb-3 border overflow-hidden"
                                    style={{ borderColor: priorityInfo?.color + '40' }}
                                >
                                    {/* Header del destino */}
                                    <View 
                                        className="px-4 py-3 flex-row items-center"
                                        style={{ backgroundColor: priorityInfo?.color + '10' }}
                                    >
                                        <View 
                                            className="w-8 h-8 rounded-full items-center justify-center mr-3"
                                            style={{ backgroundColor: priorityInfo?.color }}
                                        >
                                            <Text className="text-white font-bold">{displayIndex + 1}</Text>
                                        </View>
                                        <View className="flex-1">
                                            <View className="flex-row items-center">
                                                <Ionicons 
                                                    name={config.destino.type === 'branch' ? 'storefront' : 'business'} 
                                                    size={14} 
                                                    color="#525252" 
                                                />
                                                <Text className="text-neutral-900 font-bold ml-1.5" numberOfLines={1}>
                                                    {config.destino.name}
                                                </Text>
                                            </View>
                                            {config.destino.type === 'branch' && (
                                                <Text className="text-neutral-500 text-xs">
                                                    De: {config.destino.clientName}
                                                </Text>
                                            )}
                                        </View>
                                        {isOtherZone && (
                                            <View className="bg-purple-100 px-2 py-0.5 rounded-full mr-2">
                                                <Text className="text-purple-700 text-[10px]">📍 Otra zona</Text>
                                            </View>
                                        )}
                                        <TouchableOpacity 
                                            onPress={() => removeDestination(originalIndex)}
                                            className="p-1"
                                        >
                                            <Ionicons name="close-circle" size={22} color="#EF4444" />
                                        </TouchableOpacity>
                                    </View>
                                    
                                    {/* Selectores de hora, prioridad y frecuencia */}
                                    <View className="px-4 py-3">
                                        {/* Primera fila: Hora y Prioridad */}
                                        <View className="flex-row gap-3 mb-2">
                                            {/* Selector de Hora */}
                                            <TouchableOpacity
                                                onPress={() => {
                                                    setEditingDestIndex(originalIndex)
                                                    setShowTimePicker(true)
                                                }}
                                                className={`flex-1 p-3 rounded-xl border flex-row items-center ${
                                                    config.hora ? 'bg-green-50 border-green-200' : 'bg-neutral-50 border-neutral-200'
                                                }`}
                                            >
                                                <Ionicons 
                                                    name="time" 
                                                    size={18} 
                                                    color={config.hora ? '#22C55E' : '#9CA3AF'} 
                                                />
                                                <View className="ml-2 flex-1">
                                                    <Text className="text-[10px] text-neutral-400">HORA</Text>
                                                    <Text className={`font-bold ${config.hora ? 'text-green-700' : 'text-neutral-400'}`}>
                                                        {config.hora || 'Asignar'}
                                                    </Text>
                                                </View>
                                                <Ionicons name="chevron-down" size={16} color="#9CA3AF" />
                                            </TouchableOpacity>
                                            
                                            {/* Selector de Prioridad */}
                                            <TouchableOpacity
                                                onPress={() => {
                                                    setEditingDestIndex(originalIndex)
                                                    setShowPriorityPicker(true)
                                                }}
                                                className="flex-1 p-3 rounded-xl border flex-row items-center"
                                                style={{ 
                                                    backgroundColor: priorityInfo?.color + '10',
                                                    borderColor: priorityInfo?.color + '40'
                                                }}
                                            >
                                                <View 
                                                    className="w-5 h-5 rounded-full items-center justify-center"
                                                    style={{ backgroundColor: priorityInfo?.color }}
                                                >
                                                    <Ionicons name={priorityInfo?.icon || 'time'} size={12} color="white" />
                                                </View>
                                                <View className="ml-2 flex-1">
                                                    <Text className="text-[10px] text-neutral-400">PRIORIDAD</Text>
                                                    <Text className="font-bold" style={{ color: priorityInfo?.color }}>
                                                        {config.prioridad}
                                                    </Text>
                                                </View>
                                                <Ionicons name="chevron-down" size={16} color="#9CA3AF" />
                                            </TouchableOpacity>
                                        </View>
                                        
                                        {/* Segunda fila: Frecuencia */}
                                        <TouchableOpacity
                                            onPress={() => {
                                                setEditingDestIndex(originalIndex)
                                                setShowFrequencyPicker(true)
                                            }}
                                            className="p-3 rounded-xl border bg-indigo-50 border-indigo-200 flex-row items-center"
                                        >
                                            <Ionicons 
                                                name="repeat" 
                                                size={18} 
                                                color="#6366F1" 
                                            />
                                            <View className="ml-2 flex-1">
                                                <Text className="text-[10px] text-neutral-400">FRECUENCIA</Text>
                                                <Text className="font-bold text-indigo-700">
                                                    {FREQUENCIES.find(f => f.id === config.frecuencia)?.label || config.frecuencia}
                                                </Text>
                                            </View>
                                            <Ionicons name="chevron-down" size={16} color="#9CA3AF" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            )
                        })}
                        
                        {/* Info de ordenamiento */}
                        <View className="bg-blue-50 p-3 rounded-xl flex-row items-start">
                            <Ionicons name="information-circle" size={18} color="#3B82F6" />
                            <Text className="text-blue-700 text-xs ml-2 flex-1">
                                El orden de visita se calcula automáticamente: primero las de prioridad ALTA, luego MEDIA, luego BAJA. Dentro de la misma prioridad, se ordenan por hora.
                            </Text>
                        </View>
                    </View>

                    {/* ============ DÍAS DE VISITA ============ */}
                    <View className="mb-6">
                        <Text className="text-lg font-bold text-neutral-900 mb-3">
                            <Text className="text-red-500">📅</Text> Días de Visita
                        </Text>
                        <View className="flex-row justify-between">
                            {DAYS.map(day => {
                                const isSelected = selectedDays.includes(day.id)
                                
                                return (
                                    <TouchableOpacity
                                        key={day.id}
                                        onPress={() => toggleDay(day.id)}
                                        className={`flex-1 mx-1 py-4 rounded-2xl items-center border-2 ${
                                            isSelected 
                                                ? 'bg-red-500 border-red-500' 
                                                : 'bg-white border-neutral-200'
                                        }`}
                                    >
                                        <Text className={`text-xs font-medium ${isSelected ? 'text-red-100' : 'text-neutral-400'}`}>
                                            {day.short}
                                        </Text>
                                        <Text className={`font-bold text-sm mt-1 ${isSelected ? 'text-white' : 'text-neutral-700'}`}>
                                            {day.label.substring(0, 3)}
                                        </Text>
                                        {isSelected && (
                                            <Ionicons name="checkmark-circle" size={16} color="white" style={{ marginTop: 4 }} />
                                        )}
                                    </TouchableOpacity>
                                )
                            })}
                        </View>
                        {selectedDays.length > 0 && (
                            <Text className="text-green-600 text-xs mt-2 text-center font-medium">
                                ✓ {selectedDays.length} día(s) • {totalRoutes} ruta(s) a crear
                            </Text>
                        )}
                    </View>

                    {/* ============ MAPA PREVIEW ============ */}
                    {destinationsWithLocation.length > 0 && (
                        <View className="mb-6">
                            <View className="flex-row items-center justify-between mb-3">
                                <Text className="text-lg font-bold text-neutral-900">
                                    <Text className="text-red-500">🗺️</Text> Vista de Ruta
                                </Text>
                                <TouchableOpacity 
                                    onPress={() => setShowFullscreenMap(true)}
                                    className="flex-row items-center bg-neutral-100 px-3 py-2 rounded-xl"
                                >
                                    <Ionicons name="expand" size={16} color="#525252" />
                                    <Text className="text-neutral-700 font-medium text-xs ml-1">Ampliar</Text>
                                </TouchableOpacity>
                            </View>
                            
                            <TouchableOpacity 
                                onPress={() => setShowFullscreenMap(true)}
                                className="h-44 rounded-2xl overflow-hidden border border-neutral-200"
                            >
                                <MapView
                                    provider={PROVIDER_GOOGLE}
                                    style={{ flex: 1 }}
                                    region={mapRegion}
                                    scrollEnabled={false}
                                    zoomEnabled={false}
                                >
                                    {/* Línea de ruta */}
                                    {routePath.length > 1 && (
                                        <Polyline
                                            coordinates={routePath}
                                            strokeColor="#3B82F6"
                                            strokeWidth={3}
                                            lineDashPattern={[10, 5]}
                                        />
                                    )}
                                    {destinationsWithLocation.map((config, index) => {
                                        const prioColor = getPriorityColor(config.prioridad)
                                        return (
                                            <Marker key={config.destino.id} coordinate={config.destino.location!} title={config.destino.name}>
                                                <View className="items-center">
                                                    <View 
                                                        className="w-8 h-8 rounded-full items-center justify-center"
                                                        style={{ backgroundColor: prioColor }}
                                                    >
                                                        <Text className="text-white font-bold text-sm">{index + 1}</Text>
                                                    </View>
                                                </View>
                                            </Marker>
                                        )
                                    })}
                                </MapView>
                                <View className="absolute bottom-3 left-3 bg-white/90 px-3 py-2 rounded-lg flex-row items-center">
                                    <Ionicons name="navigate" size={14} color="#3B82F6" />
                                    <Text className="text-neutral-700 text-xs font-medium ml-1">{destinationsWithLocation.length} puntos</Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* ============ RESUMEN FINAL ============ */}
                    {selectedDays.length > 0 && (
                        <View className="bg-neutral-900 p-5 rounded-2xl mb-6">
                            <Text className="text-white font-bold text-lg mb-3">📋 Resumen Final</Text>
                            <View className="space-y-2">
                                <View className="flex-row mt-1">
                                    <Text className="text-neutral-400 w-24">Zona:</Text>
                                    <Text className="text-white font-medium flex-1">{zone.nombre}</Text>
                                </View>
                                <View className="flex-row mt-1">
                                    <Text className="text-neutral-400 w-24">Destinos:</Text>
                                    <Text className="text-white font-medium flex-1">{destinationConfigs.length}</Text>
                                </View>
                                <View className="flex-row mt-1">
                                    <Text className="text-neutral-400 w-24">Días:</Text>
                                    <Text className="text-white font-medium flex-1">
                                        {selectedDays.map(d => DAYS.find(day => day.id === d)?.label).join(', ')}
                                    </Text>
                                </View>
                                <View className="flex-row mt-1">
                                    <Text className="text-neutral-400 w-24">Frecuencias:</Text>
                                    <Text className="text-white font-medium flex-1">
                                        {(() => {
                                            const freqCounts = destinationConfigs.reduce((acc, c) => {
                                                acc[c.frecuencia] = (acc[c.frecuencia] || 0) + 1
                                                return acc
                                            }, {} as Record<string, number>)
                                            return Object.entries(freqCounts)
                                                .map(([f, count]) => `${count} ${FREQUENCIES.find(fr => fr.id === f)?.label?.toLowerCase() || f}`)
                                                .join(', ')
                                        })()}
                                    </Text>
                                </View>
                                <View className="border-t border-neutral-700 pt-3 mt-3">
                                    <Text className="text-white font-bold text-center">
                                        Total: {totalRoutes} ruta(s) a crear
                                    </Text>
                                </View>
                            </View>
                        </View>
                    )}

                    {/* ============ BOTONES ============ */}
                    <View className="flex-row gap-3">
                        <TouchableOpacity
                            onPress={() => navigation.reset({
                                index: 0,
                                routes: [{ name: 'SupervisorRoutes' }]
                            })}
                            className="flex-1 py-5 rounded-2xl items-center border-2 border-neutral-300 bg-white"
                        >
                            <View className="flex-row items-center">
                                <Ionicons name="home" size={18} color="#525252" />
                                <Text className="text-neutral-700 font-bold text-base ml-2">Inicio</Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={handleSave}
                            disabled={loading || selectedDays.length === 0}
                            className={`flex-2 py-5 rounded-2xl items-center shadow-lg px-8 ${
                                selectedDays.length > 0 && !loading
                                    ? 'bg-red-500' 
                                    : 'bg-neutral-300'
                            }`}
                        >
                            {loading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <View className="flex-row items-center">
                                    <Ionicons name="save" size={18} color="white" />
                                    <Text className="text-white font-bold text-base ml-2">Guardar</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>

                    <View className="h-6" />
                </View>
            </ScrollView>

            {/* ============ MODAL: MAPA FULLSCREEN ============ */}
            <Modal visible={showFullscreenMap} animationType="slide" onRequestClose={() => setShowFullscreenMap(false)}>
                <SafeAreaView className="flex-1 bg-white">
                    <View className="flex-row items-center justify-between px-4 py-3 border-b border-neutral-200">
                        <TouchableOpacity onPress={() => setShowFullscreenMap(false)}>
                            <Ionicons name="close" size={28} color="#525252" />
                        </TouchableOpacity>
                        <Text className="text-lg font-bold">Mapa de Ruta</Text>
                        <View className="bg-blue-100 px-2 py-1 rounded-full">
                            <Text className="text-blue-700 text-xs font-bold">{destinationsWithLocation.length} puntos</Text>
                        </View>
                    </View>

                    <MapView
                        provider={PROVIDER_GOOGLE}
                        style={{ flex: 1 }}
                        initialRegion={mapRegion}
                        showsUserLocation
                        showsMyLocationButton
                    >
                        {/* Línea de ruta */}
                        {routePath.length > 1 && (
                            <Polyline
                                coordinates={routePath}
                                strokeColor="#3B82F6"
                                strokeWidth={3}
                                lineDashPattern={[10, 5]}
                            />
                        )}
                        {destinationsWithLocation.map((config, index) => {
                            const prioColor = getPriorityColor(config.prioridad)
                            return (
                                <Marker 
                                    key={config.destino.id} 
                                    coordinate={config.destino.location!} 
                                    title={`${index + 1}. ${config.destino.name}`} 
                                    description={`${config.hora || 'Sin hora'} - ${config.prioridad}`}
                                >
                                    <View className="items-center">
                                        <View 
                                            className="w-12 h-12 rounded-full items-center justify-center border-2 border-white"
                                            style={{ backgroundColor: prioColor }}
                                        >
                                            <Text className="text-white font-bold text-lg">{index + 1}</Text>
                                        </View>
                                    </View>
                                </Marker>
                            )
                        })}
                    </MapView>

                    {/* Lista de destinos */}
                    <View className="max-h-52 bg-white border-t border-neutral-200">
                        <View className="px-4 py-2 bg-neutral-50 flex-row items-center justify-between">
                            <Text className="text-neutral-700 font-bold text-sm">Orden de Visita ({destinationsWithLocation.length})</Text>
                            <Text className="text-neutral-500 text-xs">Ordenado por prioridad/hora</Text>
                        </View>
                        <ScrollView className="px-4">
                            {destinationsWithLocation.map((config, index) => {
                                const prioColor = getPriorityColor(config.prioridad)
                                const freqLabel = FREQUENCIES.find(f => f.id === config.frecuencia)?.label || config.frecuencia
                                return (
                                    <View key={config.destino.id} className="flex-row items-center py-3 border-b border-neutral-100">
                                        <View 
                                            className="w-8 h-8 rounded-full items-center justify-center mr-3"
                                            style={{ backgroundColor: prioColor }}
                                        >
                                            <Text className="text-white font-bold text-sm">{index + 1}</Text>
                                        </View>
                                        <View className="flex-1">
                                            <Text className="text-neutral-900 font-medium" numberOfLines={1}>{config.destino.name}</Text>
                                            <View className="flex-row items-center flex-wrap mt-0.5">
                                                <Text className="text-green-600 text-xs font-medium">{config.hora || '--:--'}</Text>
                                                <Text className="text-neutral-300 mx-2">•</Text>
                                                <Text className="text-xs" style={{ color: prioColor }}>{config.prioridad}</Text>
                                                <Text className="text-neutral-300 mx-2">•</Text>
                                                <Text className="text-indigo-600 text-xs">{freqLabel}</Text>
                                            </View>
                                        </View>
                                        <Ionicons 
                                            name={config.destino.type === 'branch' ? 'storefront' : 'business'} 
                                            size={20} 
                                            color="#9CA3AF" 
                                        />
                                    </View>
                                )
                            })}
                        </ScrollView>
                    </View>
                </SafeAreaView>
            </Modal>

            {/* ============ MODAL: SELECTOR DE HORA POR DESTINO ============ */}
            <GenericModal
                visible={showTimePicker}
                title={editingDestIndex !== null ? `Hora - ${destinationConfigs[editingDestIndex]?.destino.name.substring(0, 20)}` : 'Seleccionar Hora'}
                onClose={() => {
                    setShowTimePicker(false)
                    setEditingDestIndex(null)
                }}
            >
                <View>
                    <View className="bg-green-50 p-3 rounded-xl mb-4 flex-row items-center">
                        <Ionicons name="time" size={20} color="#22C55E" />
                        <Text className="text-green-800 text-sm ml-2 flex-1">
                            Hora de arribo para este destino
                        </Text>
                    </View>
                    
                    <ScrollView className="max-h-80" showsVerticalScrollIndicator={false}>
                        <View className="flex-row flex-wrap justify-center">
                            {AVAILABLE_HOURS.map(hour => {
                                const currentHora = editingDestIndex !== null ? destinationConfigs[editingDestIndex]?.hora : ''
                                const isSelected = currentHora === hour
                                const hourNum = parseInt(hour.split(':')[0])
                                const isMorning = hourNum < 12
                                const isAfternoon = hourNum >= 12 && hourNum < 18
                                
                                return (
                                    <TouchableOpacity
                                        key={hour}
                                        onPress={() => {
                                            if (editingDestIndex !== null) {
                                                updateDestinationHora(editingDestIndex, hour)
                                            }
                                            setShowTimePicker(false)
                                            setEditingDestIndex(null)
                                        }}
                                        className={`w-20 m-1 p-3 rounded-xl items-center justify-center border ${
                                            isSelected 
                                                ? 'bg-green-500 border-green-600' 
                                                : 'bg-white border-neutral-200'
                                        }`}
                                    >
                                        <Text className={`font-bold text-base ${isSelected ? 'text-white' : 'text-neutral-900'}`}>
                                            {hour}
                                        </Text>
                                        <Text className={`text-[10px] ${isSelected ? 'text-green-100' : 'text-neutral-400'}`}>
                                            {isMorning ? 'AM' : isAfternoon ? 'PM' : 'Noche'}
                                        </Text>
                                    </TouchableOpacity>
                                )
                            })}
                        </View>
                    </ScrollView>
                    
                    {editingDestIndex !== null && destinationConfigs[editingDestIndex]?.hora && (
                        <TouchableOpacity
                            onPress={() => {
                                if (editingDestIndex !== null) {
                                    updateDestinationHora(editingDestIndex, '')
                                }
                                setShowTimePicker(false)
                                setEditingDestIndex(null)
                            }}
                            className="mt-4 py-3 rounded-xl bg-neutral-100 items-center"
                        >
                            <Text className="text-neutral-600 font-medium">Quitar hora</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </GenericModal>

            {/* ============ MODAL: SELECTOR DE PRIORIDAD POR DESTINO ============ */}
            <GenericModal
                visible={showPriorityPicker}
                title={editingDestIndex !== null ? `Prioridad - ${destinationConfigs[editingDestIndex]?.destino.name.substring(0, 20)}` : 'Seleccionar Prioridad'}
                onClose={() => {
                    setShowPriorityPicker(false)
                    setEditingDestIndex(null)
                }}
            >
                <View>
                    <View className="bg-amber-50 p-3 rounded-xl mb-4 flex-row items-center">
                        <Ionicons name="flash" size={20} color="#F59E0B" />
                        <Text className="text-amber-800 text-sm ml-2 flex-1">
                            Los destinos se ordenan automáticamente por prioridad
                        </Text>
                    </View>
                    
                    <View className="gap-3">
                        {PRIORITIES.map(prio => {
                            const currentPrio = editingDestIndex !== null ? destinationConfigs[editingDestIndex]?.prioridad : ''
                            const isSelected = currentPrio === prio.id
                            
                            return (
                                <TouchableOpacity
                                    key={prio.id}
                                    onPress={() => {
                                        if (editingDestIndex !== null) {
                                            updateDestinationPrioridad(editingDestIndex, prio.id as PriorityType)
                                        }
                                        setShowPriorityPicker(false)
                                        setEditingDestIndex(null)
                                    }}
                                    className={`p-4 rounded-2xl border-2 flex-row items-center ${
                                        isSelected ? '' : 'bg-white border-neutral-200'
                                    }`}
                                    style={isSelected ? { 
                                        borderColor: prio.color, 
                                        backgroundColor: prio.color + '15' 
                                    } : {}}
                                >
                                    <View 
                                        className="w-10 h-10 rounded-full items-center justify-center mr-4" 
                                        style={{ backgroundColor: prio.color }}
                                    >
                                        <Ionicons name={prio.icon} size={20} color="white" />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="font-bold text-base" style={{ color: prio.color }}>
                                            {prio.label}
                                        </Text>
                                        <Text className="text-neutral-500 text-xs">
                                            {prio.id === 'ALTA' && 'Se visita primero'}
                                            {prio.id === 'MEDIA' && 'Orden intermedio'}
                                            {prio.id === 'BAJA' && 'Se visita al final'}
                                        </Text>
                                    </View>
                                    {isSelected && (
                                        <Ionicons name="checkmark-circle" size={24} color={prio.color} />
                                    )}
                                </TouchableOpacity>
                            )
                        })}
                    </View>
                </View>
            </GenericModal>

            {/* ============ MODAL: SELECTOR DE FRECUENCIA POR DESTINO ============ */}
            <GenericModal
                visible={showFrequencyPicker}
                title={editingDestIndex !== null ? `Frecuencia - ${destinationConfigs[editingDestIndex]?.destino.name.substring(0, 20)}` : 'Seleccionar Frecuencia'}
                onClose={() => {
                    setShowFrequencyPicker(false)
                    setEditingDestIndex(null)
                }}
            >
                <View>
                    <View className="bg-indigo-50 p-3 rounded-xl mb-4 flex-row items-center">
                        <Ionicons name="repeat" size={20} color="#6366F1" />
                        <Text className="text-indigo-800 text-sm ml-2 flex-1">
                            ¿Cada cuánto tiempo se visitará este cliente?
                        </Text>
                    </View>
                    
                    <View className="gap-3">
                        {FREQUENCIES.map(freq => {
                            const currentFreq = editingDestIndex !== null ? destinationConfigs[editingDestIndex]?.frecuencia : ''
                            const isSelected = currentFreq === freq.id
                            
                            return (
                                <TouchableOpacity
                                    key={freq.id}
                                    onPress={() => {
                                        if (editingDestIndex !== null) {
                                            updateDestinationFrecuencia(editingDestIndex, freq.id as FrequencyType)
                                        }
                                        setShowFrequencyPicker(false)
                                        setEditingDestIndex(null)
                                    }}
                                    className={`p-4 rounded-2xl border-2 flex-row items-center ${
                                        isSelected ? 'bg-indigo-50 border-indigo-400' : 'bg-white border-neutral-200'
                                    }`}
                                >
                                    <View 
                                        className={`w-10 h-10 rounded-full items-center justify-center mr-4 ${
                                            isSelected ? 'bg-indigo-500' : 'bg-neutral-200'
                                        }`}
                                    >
                                        <Ionicons name={freq.icon} size={20} color={isSelected ? 'white' : '#6B7280'} />
                                    </View>
                                    <View className="flex-1">
                                        <Text className={`font-bold text-base ${isSelected ? 'text-indigo-700' : 'text-neutral-700'}`}>
                                            {freq.label}
                                        </Text>
                                        <Text className="text-neutral-500 text-xs">
                                            {freq.id === 'SEMANAL' && 'Visita cada semana'}
                                            {freq.id === 'QUINCENAL' && 'Visita cada 2 semanas'}
                                            {freq.id === 'MENSUAL' && 'Visita cada mes'}
                                        </Text>
                                    </View>
                                    {isSelected && (
                                        <Ionicons name="checkmark-circle" size={24} color="#6366F1" />
                                    )}
                                </TouchableOpacity>
                            )
                        })}
                    </View>
                </View>
            </GenericModal>

            <FeedbackModal
                visible={feedbackModal.visible}
                type={feedbackModal.type}
                title={feedbackModal.title}
                message={feedbackModal.message}
                onClose={() => setFeedbackModal(prev => ({ ...prev, visible: false }))}
                onConfirm={feedbackModal.onConfirm}
            />
        </View>
    )
}

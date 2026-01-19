import React, { useCallback, useMemo, useState } from 'react'
import { Alert, ScrollView, Text, View } from 'react-native'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import type { Zone } from '../../../../services/api/ZoneService'
import { RouteService, RoutePlan } from '../../../../services/api/RouteService'
import type { RouteDestination } from './routeCreate.types'
import { DAYS } from './routeSchedule.constants'
import type { DestinationConfig } from './routeSchedule.types'
import { getMapRegion, getRoutePath, sortDestinationConfigs } from './routeSchedule.utils'
import { Header } from '../../../../components/ui/Header'
import { FeedbackModal, FeedbackType } from '../../../../components/ui/FeedbackModal'
import { StepIndicator } from '../../../../components/ui/StepIndicator'
import { DayPickerGrid } from '../../../../components/ui/DayPickerGrid'
import { PickerModal } from '../../../../components/ui/PickerModal'
import { TimePickerModal } from '../../../../components/ui/TimePickerModal'
import { RouteScheduleActions } from './components/RouteScheduleActions'
import { RouteScheduleDestinationsSection } from './components/RouteScheduleDestinationsSection'
import { RouteScheduleFullscreenMapModal } from './components/RouteScheduleFullscreenMapModal'
import { RouteScheduleMapPreview } from './components/RouteScheduleMapPreview'
import { RouteScheduleZoneSummaryCard } from './components/RouteScheduleZoneSummaryCard'
import { RouteScheduleSummaryCard } from './components/RouteScheduleSummaryCard'
import { FREQUENCIES, PRIORITIES } from './routeSchedule.constants'

type RouteParams = {
  SupervisorRouteCreatePaso2: {
    zone: Zone
    destinations: RouteDestination[]
    existingRoutes: RoutePlan[]
  }
}

export function SupervisorRouteScheduleScreen() {
  const navigation = useNavigation<any>()
  const route = useRoute<RouteProp<RouteParams, 'SupervisorRouteCreatePaso2'>>()

  const { zone, destinations, existingRoutes } = route.params

  const [destinationConfigs, setDestinationConfigs] = useState<DestinationConfig[]>(() =>
    destinations.map(dest => ({ destino: dest, hora: '', prioridad: 'MEDIA', frecuencia: 'SEMANAL' })),
  )

  const [selectedDays, setSelectedDays] = useState<number[]>([])
  const [loading, setLoading] = useState(false)

  const [showFullscreenMap, setShowFullscreenMap] = useState(false)
  const [editingDestIndex, setEditingDestIndex] = useState<number | null>(null)
  const [showTimePicker, setShowTimePicker] = useState(false)
  const [showPriorityPicker, setShowPriorityPicker] = useState(false)
  const [showFrequencyPicker, setShowFrequencyPicker] = useState(false)

  const [feedbackModal, setFeedbackModal] = useState<{
    visible: boolean
    type: FeedbackType
    title: string
    message: string
    onConfirm?: () => void
  }>({ visible: false, type: 'info', title: '', message: '' })

  const sortedConfigs = useMemo(() => sortDestinationConfigs(destinationConfigs), [destinationConfigs])
  const destinationsWithLocation = useMemo(() => sortedConfigs.filter(c => c.destino.location != null), [sortedConfigs])
  const mapRegion = useMemo(() => getMapRegion(destinationsWithLocation), [destinationsWithLocation])
  const routePath = useMemo(() => getRoutePath(destinationsWithLocation), [destinationsWithLocation])
  const totalRoutes = destinationConfigs.length * selectedDays.length

  const closePickers = useCallback(() => {
    setShowTimePicker(false)
    setShowPriorityPicker(false)
    setShowFrequencyPicker(false)
    setEditingDestIndex(null)
  }, [])

  const toggleDay = useCallback((dayId: number) => {
    setSelectedDays(prev => (prev.includes(dayId) ? prev.filter(d => d !== dayId) : [...prev, dayId]))
  }, [])

  const updateDestinationHora = useCallback((index: number, hora: string) => {
    setDestinationConfigs(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], hora }
      return updated
    })
  }, [])

  const updateDestinationPrioridad = useCallback((index: number, prioridad: DestinationConfig['prioridad']) => {
    setDestinationConfigs(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], prioridad }
      return updated
    })
  }, [])

  const updateDestinationFrecuencia = useCallback((index: number, frecuencia: DestinationConfig['frecuencia']) => {
    setDestinationConfigs(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], frecuencia }
      return updated
    })
  }, [])

  const removeDestination = useCallback(
    (index: number) => {
      if (destinationConfigs.length <= 1) {
        Alert.alert('Mínimo requerido', 'Debe haber al menos un destino en la ruta.')
        return
      }
      Alert.alert('Eliminar destino', `¿Quitar "${destinationConfigs[index].destino.name}" de la ruta?`, [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => setDestinationConfigs(prev => prev.filter((_, i) => i !== index)) },
      ])
    },
    [destinationConfigs],
  )

  const handleSave = async () => {
    if (selectedDays.length === 0) {
      setFeedbackModal({
        visible: true,
        type: 'warning',
        title: 'Selecciona días',
        message: 'Debes seleccionar al menos un día de visita.',
      })
      return
    }

    const sinHora = sortedConfigs.filter(c => !c.hora)
    if (sinHora.length > 0) {
      setFeedbackModal({
        visible: true,
        type: 'warning',
        title: 'Hora requerida',
        message: `${sinHora.length} destino(s) no tienen hora asignada. Asigna una hora a cada visita.`,
      })
      return
    }

    const horasUsadas = new Map<string, string[]>()
    sortedConfigs.forEach(config => {
      const horaKey = config.hora
      if (!horasUsadas.has(horaKey)) horasUsadas.set(horaKey, [])
      horasUsadas.get(horaKey)!.push(config.destino.name)
    })

    const horasDuplicadas: string[] = []
    horasUsadas.forEach((destinos, hora) => {
      if (destinos.length > 1) horasDuplicadas.push(`${hora}: ${destinos.join(', ')}`)
    })

    if (horasDuplicadas.length > 0) {
      setFeedbackModal({
        visible: true,
        type: 'warning',
        title: 'Horas duplicadas',
        message: `No puedes asignar la misma hora a múltiples destinos:\n\n${horasDuplicadas.slice(0, 3).join('\n')}`,
      })
      return
    }

    const duplicateRoutes: string[] = []
    sortedConfigs.forEach(config => {
      selectedDays.forEach(day => {
        const existingRoute = existingRoutes.find(r => {
          const sameClient = r.cliente_id === config.destino.clientId
          const sameDay = r.dia_semana === day
          const isActive = r.activo
          const sameBranch = config.destino.type === 'branch' ? r.sucursal_id === config.destino.id : !r.sucursal_id
          return sameClient && sameDay && isActive && sameBranch
        })

        if (existingRoute) {
          const dayLabel = DAYS.find(d => d.id === day)?.label || ''
          duplicateRoutes.push(`${config.destino.name} - ${dayLabel}`)
        }
      })
    })

    if (duplicateRoutes.length > 0) {
      setFeedbackModal({
        visible: true,
        type: 'warning',
        title: 'Ruta ya existe',
        message: `Las siguientes rutas ya están creadas:\n\n${duplicateRoutes.slice(0, 5).join('\n')}${duplicateRoutes.length > 5 ? `\n... y ${duplicateRoutes.length - 5} más` : ''
          }\n\nElimina los destinos duplicados o selecciona otros días.`,
      })
      return
    }

    setLoading(true)
    try {
      const results: { success: boolean; name: string; day: string; error?: string }[] = []

      for (const config of sortedConfigs) {
        for (const day of selectedDays) {
          const dayLabel = DAYS.find(d => d.id === day)?.label || ''
          try {
            const existingCheck = await RouteService.checkDuplicate(
              config.destino.clientId,
              day,
              undefined,
              config.destino.type === 'branch' ? config.destino.id : undefined,
            )

            if (existingCheck) {
              results.push({ success: false, name: config.destino.name, day: dayLabel, error: 'Ya existe' })
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
              hora_estimada_arribo: config.hora || undefined,
            }

            await RouteService.create(payload)
            results.push({ success: true, name: config.destino.name, day: dayLabel })
          } catch (err: any) {
            results.push({
              success: false,
              name: config.destino.name,
              day: dayLabel,
              error: err?.message?.includes('500') ? 'Ruta ya existe' : err?.message,
            })
          }
        }
      }

      const successCount = results.filter(r => r.success).length
      const failedCount = results.filter(r => !r.success).length

      if (failedCount > 0 && successCount === 0) {
        const failedList = results.filter(r => !r.success).slice(0, 3)
        setFeedbackModal({
          visible: true,
          type: 'error',
          title: 'No se crearon rutas',
          message: `Todas las rutas ya existen o hubo errores:\n\n${failedList.map(f => `• ${f.name} (${f.day}): ${f.error}`).join('\n')}`,
        })
      } else if (failedCount > 0) {
        setFeedbackModal({
          visible: true,
          type: 'warning',
          title: 'Rutas parcialmente creadas',
          message: `Se crearon ${successCount} ruta(s).\n${failedCount} ruta(s) no se crearon porque ya existían.`,
          onConfirm: () => navigation.reset({ index: 0, routes: [{ name: 'SupervisorRoutes' }] }),
        })
      } else {
        setFeedbackModal({
          visible: true,
          type: 'success',
          title: '¡Rutas creadas!',
          message: `Se crearon ${successCount} ruta(s) para ${sortedConfigs.length} destino(s).`,
          onConfirm: () => navigation.reset({ index: 0, routes: [{ name: 'SupervisorRoutes' }] }),
        })
      }
    } catch (error: any) {
      setFeedbackModal({
        visible: true,
        type: 'error',
        title: 'Error',
        message: error?.message || 'No se pudieron crear las rutas',
      })
    } finally {
      setLoading(false)
    }
  }

  const currentDest = editingDestIndex != null ? destinationConfigs[editingDestIndex]?.destino : undefined

  return (
    <View className="flex-1 bg-neutral-50">
      <Header title="Nueva Ruta" variant="standard" onBackPress={() => navigation.reset({ index: 0, routes: [{ name: 'SupervisorRoutes' }] })} />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="p-5">
          <StepIndicator
            steps={[
              { id: 1, label: 'Zona' },
              { id: 2, label: 'Horario' },
            ]}
            currentStep={2}
            helperText="Configura los días, frecuencia y prioridad de visita"
          />

          <RouteScheduleZoneSummaryCard zoneName={zone.nombre} destinationsCount={destinationConfigs.length} onAddMore={() => navigation.goBack()} />

          <RouteScheduleDestinationsSection
            zoneId={zone.id}
            destinationConfigs={destinationConfigs}
            sortedConfigs={sortedConfigs}
            onRemoveDestination={removeDestination}
            onOpenTimePicker={(index: number) => {
              setEditingDestIndex(index)
              setShowTimePicker(true)
            }}
            onOpenPriorityPicker={(index: number) => {
              setEditingDestIndex(index)
              setShowPriorityPicker(true)
            }}
            onOpenFrequencyPicker={(index: number) => {
              setEditingDestIndex(index)
              setShowFrequencyPicker(true)
            }}
          />

          <DayPickerGrid
            days={DAYS}
            selectedDays={selectedDays}
            onToggleDay={toggleDay}
            title={<Text className="text-lg font-bold text-neutral-900"><Text className="text-red-500">2.</Text> Días de visita</Text>}
            summaryText={selectedDays.length > 0 ? `✓ ${selectedDays.length} día(s) • ${totalRoutes} ruta(s) a crear` : undefined}
          />

          <RouteScheduleMapPreview
            destinationsWithLocation={destinationsWithLocation}
            mapRegion={mapRegion}
            routePath={routePath}
            onExpand={() => setShowFullscreenMap(true)}
          />

          <RouteScheduleSummaryCard zoneName={zone.nombre} destinationConfigs={destinationConfigs} selectedDays={selectedDays} totalRoutes={totalRoutes} />

          <RouteScheduleActions
            canSave={selectedDays.length > 0 && !loading}
            loading={loading}
            onHome={() => navigation.reset({ index: 0, routes: [{ name: 'SupervisorRoutes' }] })}
            onSave={handleSave}
          />

          <View className="h-6" />
        </View>
      </ScrollView>

      <RouteScheduleFullscreenMapModal
        visible={showFullscreenMap}
        onClose={() => setShowFullscreenMap(false)}
        destinationsWithLocation={destinationsWithLocation}
        mapRegion={mapRegion}
        routePath={routePath}
      />

      <TimePickerModal
        visible={showTimePicker}
        title={currentDest?.name ? `Hora - ${currentDest.name.substring(0, 20)}` : 'Seleccionar hora'}
        infoText="Selecciona la hora estimada de arribo"
        initialTime={editingDestIndex != null ? destinationConfigs[editingDestIndex]?.hora : undefined}
        onSelectTime={hour => {
          if (editingDestIndex != null) updateDestinationHora(editingDestIndex, hour)
          closePickers()
        }}
        onClear={editingDestIndex != null && destinationConfigs[editingDestIndex]?.hora ? () => {
          if (editingDestIndex != null) updateDestinationHora(editingDestIndex, '')
          closePickers()
        } : undefined}
        onClose={closePickers}
      />

      <PickerModal
        visible={showPriorityPicker}
        title={currentDest?.name ? `Prioridad - ${currentDest.name.substring(0, 20)}` : 'Seleccionar prioridad'}
        infoText="¿Qué tan urgente es visitar este cliente?"
        infoIcon="flag"
        infoColor="#EF4444"
        options={PRIORITIES.map(p => ({
          id: p.id,
          label: p.label,
          icon: p.icon,
          color: p.color,
          description: p.id === 'ALTA' ? 'Visita prioritaria' : p.id === 'MEDIA' ? 'Visita regular' : 'Sin urgencia',
        }))}
        selectedId={editingDestIndex != null ? destinationConfigs[editingDestIndex]?.prioridad : undefined}
        onSelect={prio => {
          if (editingDestIndex != null) updateDestinationPrioridad(editingDestIndex, prio as DestinationConfig['prioridad'])
          closePickers()
        }}
        onClose={closePickers}
      />

      <PickerModal
        visible={showFrequencyPicker}
        title={currentDest?.name ? `Frecuencia - ${currentDest.name.substring(0, 20)}` : 'Seleccionar frecuencia'}
        infoText="¿Cada cuánto tiempo se visitará este cliente?"
        infoIcon="repeat"
        infoColor="#6366F1"
        options={FREQUENCIES.map(f => ({
          id: f.id,
          label: f.label,
          icon: 'repeat',
          description: f.id === 'SEMANAL' ? 'Visita cada semana' : f.id === 'QUINCENAL' ? 'Visita cada 2 semanas' : 'Visita cada mes',
        }))}
        selectedId={editingDestIndex != null ? destinationConfigs[editingDestIndex]?.frecuencia : undefined}
        onSelect={freq => {
          if (editingDestIndex != null) updateDestinationFrecuencia(editingDestIndex, freq as DestinationConfig['frecuencia'])
          closePickers()
        }}
        onClose={closePickers}
      />

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



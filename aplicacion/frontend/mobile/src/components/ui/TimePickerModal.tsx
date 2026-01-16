import React, { useState, useEffect } from 'react'
import { View, Text, TouchableOpacity, Platform } from 'react-native'
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker'
import { Ionicons } from '@expo/vector-icons'
import { GenericModal } from './GenericModal'
import { BRAND_COLORS } from '../../shared/types'

type Props = {
  visible: boolean
  title?: string
  infoText?: string
  initialTime?: string // HH:MM
  onSelectTime: (time: string) => void
  onClear?: () => void
  onClose: () => void
}

export function TimePickerModal({
  visible,
  title = 'Seleccionar hora',
  infoText = 'Selecciona la hora deseada',
  initialTime,
  onSelectTime,
  onClear,
  onClose,
}: Props) {
  const parseTime = (timeStr?: string): Date => {
    if (!timeStr) {
      const date = new Date()
      date.setHours(8, 0, 0, 0)
      return date
    }
    const [hours, minutes] = timeStr.split(':').map(Number)
    const date = new Date()
    date.setHours(hours, minutes, 0, 0)
    return date
  }

  const [selectedTime, setSelectedTime] = useState<Date>(parseTime(initialTime))
  const [showPicker, setShowPicker] = useState(Platform.OS === 'ios')

  useEffect(() => {
    if (visible) {
      setSelectedTime(parseTime(initialTime))
      setShowPicker(Platform.OS === 'ios')
    }
  }, [visible, initialTime])

  const formatTime = (date: Date): string => {
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    return `${hours}:${minutes}`
  }

  const handleTimeChange = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false)
    }

    if (date && event.type === 'set') {
      setSelectedTime(date)
      const formattedTime = formatTime(date)
      onSelectTime(formattedTime)
      if (Platform.OS === 'android') {
        onClose()
      }
    } else if (event.type === 'dismissed') {
      setShowPicker(false)
      if (Platform.OS === 'android') {
        onClose()
      }
    }
  }

  const handleConfirm = () => {
    const formattedTime = formatTime(selectedTime)
    onSelectTime(formattedTime)
    onClose()
  }

  return (
    <GenericModal visible={visible} title={title} onClose={onClose}>
      <View>
        <View
          className="p-3 rounded-xl mb-4 flex-row items-center"
          style={{ backgroundColor: BRAND_COLORS.cream }}
        >
          <Ionicons name="time" size={20} color={BRAND_COLORS.gold} />
          <Text className="text-sm ml-2 flex-1" style={{ color: '#92400E' }}>
            {infoText}
          </Text>
        </View>

        {showPicker && (
          <View className="items-center py-4">
            <DateTimePicker
              value={selectedTime}
              mode="time"
              is24Hour={true}
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleTimeChange}
              minuteInterval={5}
              themeVariant="light"
            />
          </View>
        )}

        {Platform.OS === 'android' && !showPicker && (
          <TouchableOpacity
            onPress={() => setShowPicker(true)}
            className="p-4 rounded-xl items-center border-2 mb-4"
            style={{ borderColor: BRAND_COLORS.red, backgroundColor: '#FEF2F2' }}
          >
            <Text className="font-bold text-lg" style={{ color: BRAND_COLORS.red }}>
              {formatTime(selectedTime)}
            </Text>
            <Text className="text-sm mt-1" style={{ color: BRAND_COLORS.red700 }}>
              Toca para cambiar
            </Text>
          </TouchableOpacity>
        )}

        <View className="flex-row gap-3">
          {onClear && initialTime && (
            <TouchableOpacity
              onPress={() => {
                onClear()
                onClose()
              }}
              className="flex-1 py-3 rounded-xl items-center"
              style={{ backgroundColor: '#F3F4F6' }}
            >
              <Text className="font-medium" style={{ color: '#6B7280' }}>
                Quitar hora
              </Text>
            </TouchableOpacity>
          )}

          {Platform.OS === 'ios' && (
            <TouchableOpacity
              onPress={handleConfirm}
              className="flex-1 py-3 rounded-xl items-center"
              style={{ backgroundColor: BRAND_COLORS.red }}
            >
              <Text className="text-white font-bold">Confirmar</Text>
            </TouchableOpacity>
          )}
        </View>

        <View className="mt-4 p-3 rounded-xl" style={{ backgroundColor: '#EFF6FF' }}>
          <View className="flex-row items-start">
            <Ionicons name="information-circle" size={18} color="#3B82F6" />
            <Text className="text-xs ml-2 flex-1" style={{ color: '#1E40AF' }}>
              Puedes seleccionar cualquier hora. El sistema ordena las visitas automáticamente.
            </Text>
          </View>
        </View>
      </View>
    </GenericModal>
  )
}

import React from 'react'
import { View, Text, TouchableOpacity, TextInput, Switch } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { BRAND_COLORS } from '../../../../../shared/types'

type Props = {
  nombre: string
  setNombre: (v: string) => void
  fechaInicio: string
  fechaFin: string
  onOpenDatePicker: (target: 'start' | 'end') => void
  tipoDescuento: 'PORCENTAJE' | 'MONTO_FIJO'
  setTipoDescuento: (t: 'PORCENTAJE' | 'MONTO_FIJO') => void
  valorDescuento: string
  setValorDescuento: (v: string) => void
  imagenBanner: string
  setImagenBanner: (v: string) => void
  activo: boolean
  setActivo: (v: boolean) => void
}

export function PromotionBasicInfoSection({
  nombre,
  setNombre,
  fechaInicio,
  fechaFin,
  onOpenDatePicker,
  tipoDescuento,
  setTipoDescuento,
  valorDescuento,
  setValorDescuento,
  imagenBanner,
  setImagenBanner,
  activo,
  setActivo,
}: Props) {
  return (
    <View className="bg-white mx-4 mt-4 p-4 rounded-xl shadow-sm border border-gray-100">
      <Text className="text-gray-500 font-bold text-xs mb-1 uppercase tracking-wider">Información básica</Text>

      <Text className="text-gray-800 font-bold mt-2 mb-1 text-sm">Nombre</Text>
      <TextInput
        className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-gray-800"
        value={nombre}
        onChangeText={setNombre}
        placeholder="Ej. Descuento Verano"
      />

      <View className="flex-row mt-4">
        <View className="flex-1 mr-2">
          <Text className="text-gray-800 font-bold mb-1 text-sm">Inicio</Text>
          <TouchableOpacity onPress={() => onOpenDatePicker('start')} className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex-row items-center justify-between">
            <Text className="text-gray-800">{fechaInicio}</Text>
            <Ionicons name="calendar-outline" size={20} color={BRAND_COLORS.red} />
          </TouchableOpacity>
        </View>
        <View className="flex-1 ml-2">
          <Text className="text-gray-800 font-bold mb-1 text-sm">Fin</Text>
          <TouchableOpacity onPress={() => onOpenDatePicker('end')} className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex-row items-center justify-between">
            <Text className="text-gray-800">{fechaFin}</Text>
            <Ionicons name="calendar-outline" size={20} color={BRAND_COLORS.red} />
          </TouchableOpacity>
        </View>
      </View>

      <View className="mt-4">
        <Text className="text-gray-800 font-bold mb-1 text-sm">Descuento</Text>
        <View className="flex-row h-12">
          <View className="flex-1 flex-row bg-gray-100 rounded-lg p-1 mr-2">
            <TouchableOpacity
              onPress={() => setTipoDescuento('PORCENTAJE')}
              style={{ flex: 1, justifyContent: 'center', alignItems: 'center', borderRadius: 6, backgroundColor: tipoDescuento === 'PORCENTAJE' ? 'white' : 'transparent' }}
            >
              <Text className={`font-bold ${tipoDescuento === 'PORCENTAJE' ? 'text-red-600' : 'text-gray-500'}`}>%</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setTipoDescuento('MONTO_FIJO')}
              style={{ flex: 1, justifyContent: 'center', alignItems: 'center', borderRadius: 6, backgroundColor: tipoDescuento === 'MONTO_FIJO' ? 'white' : 'transparent' }}
            >
              <Text className={`font-bold ${tipoDescuento === 'MONTO_FIJO' ? 'text-red-600' : 'text-gray-500'}`}>$</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            className="flex-1 bg-white border border-gray-200 rounded-lg px-4 text-right font-bold text-lg text-red-600"
            value={valorDescuento}
            onChangeText={setValorDescuento}
            keyboardType="numeric"
            placeholder="0"
          />
        </View>
      </View>

      <View className="mt-4">
        <Text className="text-gray-800 font-bold mb-1 text-sm">URL banner (opcional)</Text>
        <TextInput
          className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-gray-800"
          value={imagenBanner}
          onChangeText={setImagenBanner}
          placeholder="https://..."
        />
      </View>

      <View className="flex-row justify-between items-center mt-6 bg-gray-50 p-3 rounded-lg border border-gray-100">
        <View>
          <Text className="text-gray-900 font-bold text-base">Estado de la campaña</Text>
          <Text className="text-gray-500 text-xs">Visible cuando está activa</Text>
        </View>
        <Switch
          trackColor={{ false: '#767577', true: '#bbf7d0' }}
          thumbColor={activo ? '#16a34a' : '#f4f3f4'}
          ios_backgroundColor="#3e3e3e"
          onValueChange={setActivo}
          value={activo}
        />
      </View>
    </View>
  )
}


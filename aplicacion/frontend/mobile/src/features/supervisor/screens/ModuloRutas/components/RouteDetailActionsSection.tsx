import React from 'react'
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { BRAND_COLORS } from '../../../../../shared/types'

type Props = {
  isEditMode: boolean
  saving: boolean
  onCancelEdit: () => void
  onSave: () => void
  onStartEdit: () => void
  onDelete: () => void
}

export function RouteDetailActionsSection({ isEditMode, saving, onCancelEdit, onSave, onStartEdit, onDelete }: Props) {
  if (isEditMode) {
    return (
      <View className="flex-row gap-3 mb-8">
        <TouchableOpacity onPress={onCancelEdit} className="flex-1 bg-neutral-200 py-4 rounded-2xl items-center">
          <Text className="text-neutral-700 font-bold">Cancelar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onSave}
          disabled={saving}
          className="flex-1 py-4 rounded-2xl items-center flex-row justify-center"
          style={{ backgroundColor: BRAND_COLORS.red }}
        >
          {saving ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <>
              <Ionicons name="checkmark" size={20} color="white" />
              <Text className="text-white font-bold ml-2">Guardar</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View className="gap-3 mb-8">
      <TouchableOpacity onPress={onStartEdit} className="bg-blue-500 py-4 rounded-2xl items-center flex-row justify-center">
        <Ionicons name="pencil" size={20} color="white" />
        <Text className="text-white font-bold ml-2">Editar ruta</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onDelete} className="py-4 rounded-2xl items-center flex-row justify-center" style={{ backgroundColor: '#FEE2E2' }}>
        <Ionicons name="trash" size={20} color={BRAND_COLORS.red} />
        <Text className="font-bold ml-2" style={{ color: BRAND_COLORS.red }}>Eliminar ruta</Text>
      </TouchableOpacity>
    </View>
  )
}

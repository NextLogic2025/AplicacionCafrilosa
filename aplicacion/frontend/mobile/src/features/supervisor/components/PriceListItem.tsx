import React from 'react'
import { View, Text, TouchableOpacity, TextInput } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { PriceList } from '../../../services/api/PriceService'

interface PriceListItemProps {
    list: PriceList
    isActive: boolean
    value?: string
    onToggle: () => void
    onChange: (text: string) => void
}

export const PriceListItem = React.memo(({ list, isActive, value = '', onToggle, onChange }: PriceListItemProps) => {
    const isGeneral = list.nombre.toLowerCase().includes('general')

    const containerStyle = isActive
        ? (isGeneral ? 'bg-blue-50 border-blue-200' : 'bg-white border-green-200 shadow-sm')
        : 'bg-neutral-50 border-neutral-200 opacity-80'

    const titleColor = isActive
        ? (isGeneral ? 'text-blue-800' : 'text-green-700')
        : 'text-neutral-500'

    return (
        <View className={`p-3 rounded-xl border ${containerStyle}`}>
            <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center">
                    {isGeneral && (
                        <Ionicons name="star" size={14} color="#2563EB" style={{ marginRight: 4 }} />
                    )}
                    <Text className={`font-bold ${titleColor}`}>
                        {list.nombre}
                    </Text>
                </View>

                <TouchableOpacity
                    onPress={onToggle}
                    className={`px-3 py-1 rounded-full border ${isActive
                        ? 'bg-red-50 border-red-100'
                        : 'bg-neutral-200 border-neutral-300'}`}
                >
                    <Text className={`text-xs font-bold ${isActive ? 'text-red-600' : 'text-neutral-600'}`}>
                        {isActive ? 'Desactivar' : 'Activar'}
                    </Text>
                </TouchableOpacity>
            </View>

            {isActive ? (
                <View className="flex-row items-center bg-white border border-neutral-200 rounded-xl px-3 h-12">
                    <Text className="text-neutral-400 mr-2 text-lg">$</Text>
                    <TextInput
                        className="flex-1 text-neutral-900 font-bold text-lg text-right"
                        placeholder="0.00"
                        placeholderTextColor="#D1D5DB"
                        keyboardType="numeric"
                        value={value}
                        onChangeText={onChange}
                        autoCorrect={false}
                        autoCapitalize="none"
                    // selectTextOnFocus removed to prevent Android crash
                    />
                </View>
            ) : (
                <View className="h-10 justify-center">
                    <Text className="text-xs text-neutral-400 italic text-center">
                        Precio inactivo. Pulse activar para asignar.
                    </Text>
                </View>
            )}
        </View>
    )
})

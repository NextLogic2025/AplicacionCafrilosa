import React from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { type Client, type ClientBranch } from '../../../../../services/api/ClientService'

interface SelectedClientBannerProps {
    client: Client | null
    branch: ClientBranch | null
    priceListName?: string
    onPress: () => void
    onClear: () => void
    placeholder?: string
}

export function SelectedClientBanner({
    client,
    branch,
    priceListName,
    onPress,
    onClear,
    placeholder = "Seleccionar Cliente"
}: SelectedClientBannerProps) {
    if (!client) {
        return (
            <TouchableOpacity onPress={onPress}>
                <View className="bg-red-50 mx-4 mt-3 p-4 rounded-xl border border-red-100 border-dashed flex-row items-center justify-center">
                    <Ionicons name="person-add-outline" size={20} color="#EF4444" />
                    <Text className="ml-2 text-red-600 font-bold">{placeholder}</Text>
                </View>
            </TouchableOpacity>
        )
    }

    return (
        <View className="bg-white mx-4 mt-3 p-3 rounded-xl border border-neutral-200 shadow-sm flex-row items-center justify-between">
            <TouchableOpacity className="flex-1 flex-row items-center" onPress={onPress}>
                <View className="w-10 h-10 bg-red-100 rounded-full items-center justify-center mr-3">
                    <Ionicons name="business" size={20} color="#EF4444" />
                </View>
                <View className="flex-1">
                    <Text className="font-bold text-neutral-800 text-[15px]" numberOfLines={1}>
                        {client.nombre_comercial || client.razon_social}
                    </Text>
                    {branch && (
                        <Text className="text-xs text-neutral-500 mt-0.5">
                            {branch.nombre_sucursal}
                        </Text>
                    )}
                    <View className="flex-row items-center mt-1">
                        <Ionicons name="pricetag-outline" size={12} color="#6B7280" />
                        <Text className="text-xs text-neutral-500 ml-1">
                            {priceListName || 'Lista General'}
                        </Text>
                    </View>
                </View>
            </TouchableOpacity>

            <TouchableOpacity
                onPress={onClear}
                className="p-2 bg-neutral-100 rounded-full ml-2"
            >
                <Ionicons name="close" size={18} color="#6B7280" />
            </TouchableOpacity>
        </View>
    )
}

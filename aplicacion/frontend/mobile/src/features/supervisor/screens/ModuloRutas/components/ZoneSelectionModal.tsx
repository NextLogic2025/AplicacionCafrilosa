import React from 'react'
import { ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { GenericModal } from '../../../../../components/ui/GenericModal'
import type { Zone } from '../../../../../services/api/ZoneService'

type Props = {
    visible: boolean
    zones: Zone[]
    selectedZoneId?: number | string
    onClose: () => void
    onSelect: (zone: Zone) => void
}

export function ZoneSelectionModal({ visible, zones, selectedZoneId, onClose, onSelect }: Props) {
    return (
        <GenericModal visible={visible} title="Seleccionar Zona" onClose={onClose}>
            <ScrollView className="max-h-96">
                {zones.map((zone) => (
                    <TouchableOpacity
                        key={zone.id}
                        onPress={() => onSelect(zone)}
                        className={`p-4 border-b border-neutral-100 flex-row items-center justify-between ${String(selectedZoneId) === String(zone.id) ? 'bg-indigo-50' : ''}`}
                    >
                        <View className="flex-row items-center flex-1">
                            <View className="w-10 h-10 rounded-full bg-indigo-100 items-center justify-center mr-3">
                                <Ionicons name="map" size={18} color="#4F46E5" />
                            </View>
                            <View className="flex-1">
                                <Text className="text-neutral-900 font-semibold">{zone.nombre}</Text>
                                <Text className="text-neutral-500 text-xs">
                                    {zone.codigo} • {zone.ciudad}
                                </Text>
                            </View>
                        </View>
                        {String(selectedZoneId) === String(zone.id) && <Ionicons name="checkmark-circle" size={24} color="#4F46E5" />}
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </GenericModal>
    )
}


import React, { useState, useEffect } from 'react'
import { View, Text, Modal, TouchableOpacity, TextInput, ScrollView, Platform } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { BRAND_COLORS } from '@cafrilosa/shared-types'
import { RoutePlan } from '../../../services/api/RouteService'

import DateTimePicker from '@react-native-community/datetimepicker'

interface Props {
    visible: boolean
    routeItem: RoutePlan | null
    onClose: () => void
    onSave: (updatedItem: RoutePlan) => void
}

export function RouteItemEditModal({ visible, routeItem, onClose, onSave }: Props) {
    const [data, setData] = useState<Partial<RoutePlan>>({})
    const [showTimePicker, setShowTimePicker] = useState(false)

    useEffect(() => {
        if (routeItem) {
            setData({ ...routeItem })
        }
    }, [routeItem])

    const handleSave = () => {
        if (routeItem && data) {
            onSave({ ...routeItem, ...data } as RoutePlan)
            onClose()
        }
    }

    if (!routeItem) return null

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View className="flex-1 bg-black/50 justify-end">
                <View className="bg-white rounded-t-3xl p-6 h-[70%]">
                    <View className="flex-row justify-between items-center mb-6">
                        <Text className="text-xl font-bold text-neutral-900">Detalles de Visita</Text>
                        <TouchableOpacity onPress={onClose} className="p-2 bg-neutral-100 rounded-full">
                            <Ionicons name="close" size={24} color="#6B7280" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        {/* Client Info */}
                        <View className="mb-6 p-4 bg-neutral-50 rounded-xl border border-neutral-100">
                            <Text className="text-sm font-bold text-neutral-500 uppercase mb-1">Cliente</Text>
                            <Text className="text-lg font-bold text-neutral-800">{routeItem._cliente?.nombre_comercial}</Text>
                            <Text className="text-sm text-neutral-600">{routeItem._cliente?.razon_social}</Text>
                        </View>

                        {/* Frequency */}
                        <View className="mb-6">
                            <Text className="text-sm font-bold text-neutral-900 mb-3">Frecuencia de Visita</Text>
                            <View className="flex-row gap-2">
                                {['SEMANAL', 'QUINCENAL', 'MENSUAL'].map((opt) => (
                                    <TouchableOpacity
                                        key={opt}
                                        onPress={() => setData({ ...data, frecuencia: opt as any })}
                                        className={`flex-1 py-3 items-center rounded-xl border ${data.frecuencia === opt ? 'bg-red-50 border-red-500' : 'bg-white border-neutral-200'}`}
                                    >
                                        <Text className={`font-bold ${data.frecuencia === opt ? 'text-red-700' : 'text-neutral-600'}`}>
                                            {opt.charAt(0) + opt.slice(1).toLowerCase()}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Priority */}
                        <View className="mb-6">
                            <Text className="text-sm font-bold text-neutral-900 mb-3">Prioridad</Text>
                            <View className="flex-row gap-2">
                                {[
                                    { id: 'ALTA', color: 'bg-red-100 border-red-200 text-red-700' },
                                    { id: 'MEDIA', color: 'bg-yellow-100 border-yellow-200 text-yellow-800' },
                                    { id: 'BAJA', color: 'bg-green-100 border-green-200 text-green-700' }
                                ].map((opt) => (
                                    <TouchableOpacity
                                        key={opt.id}
                                        onPress={() => setData({ ...data, prioridad_visita: opt.id as any })}
                                        className={`flex-1 py-3 items-center rounded-xl border ${data.prioridad_visita === opt.id ? `border-2 ${opt.color.split(' ')[1]}` : 'border-neutral-200 bg-white'}`}
                                    >
                                        <View className={`w-3 h-3 rounded-full mr-1 ${opt.color.split(' ')[0]} mb-1`} />
                                        <Text className={`font-bold ${data.prioridad_visita === opt.id ? 'text-neutral-900' : 'text-neutral-500'}`}>
                                            {opt.id}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Estimated Time */}
                        <View className="mb-8">
                            <Text className="text-sm font-bold text-neutral-900 mb-2">Hora Estimada (HH:MM)</Text>
                            <TouchableOpacity
                                onPress={() => setShowTimePicker(true)}
                                className="w-full bg-neutral-50 px-4 py-3 rounded-xl border border-neutral-200"
                            >
                                <Text className="text-lg font-medium text-neutral-900">
                                    {data.hora_estimada_arribo || 'Seleccionar Hora'}
                                </Text>
                            </TouchableOpacity>

                            {showTimePicker && (
                                <DateTimePicker
                                    value={(() => {
                                        if (!data.hora_estimada_arribo) return new Date()
                                        const [h, m] = data.hora_estimada_arribo.split(':')
                                        const d = new Date()
                                        d.setHours(parseInt(h), parseInt(m))
                                        return d
                                    })()}
                                    mode="time"
                                    is24Hour={true}
                                    display="spinner" // or 'default'
                                    onChange={(event, selectedDate) => {
                                        setShowTimePicker(Platform.OS === 'ios')
                                        if (selectedDate) {
                                            const timeStr = selectedDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
                                            setData({ ...data, hora_estimada_arribo: timeStr })
                                        }
                                    }}
                                />
                            )}
                            <Text className="text-xs text-neutral-400 mt-1">Selecciona la hora estimada de visita</Text>
                        </View>
                    </ScrollView>

                    {/* Actions */}
                    <TouchableOpacity
                        onPress={handleSave}
                        className="bg-red-500 rounded-xl py-4 items-center mb-4 shadow-lg"
                    >
                        <Text className="text-white font-bold text-base">Guardar Cambios</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    )
}

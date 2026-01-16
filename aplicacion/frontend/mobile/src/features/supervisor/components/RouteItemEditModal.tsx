import React, { useState, useEffect } from 'react'
import { View, Text, Modal, TouchableOpacity, ScrollView, Platform } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { BRAND_COLORS } from '../../../shared/types'
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
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
                <View style={{ backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, height: '70%' }}>
                    <View style={{ padding: 20, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#111827' }}>Detalles de Visita</Text>
                            <TouchableOpacity onPress={onClose} style={{ padding: 8, backgroundColor: '#F3F4F6', borderRadius: 20 }}>
                                <Ionicons name="close" size={24} color="#6B7280" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <ScrollView style={{ flex: 1, padding: 20 }} showsVerticalScrollIndicator={false}>
                        <View style={{ marginBottom: 24, padding: 16, backgroundColor: '#FEF2F2', borderRadius: 12, borderWidth: 1, borderColor: '#FEE2E2' }}>
                            <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#9CA3AF', marginBottom: 8 }}>CLIENTE</Text>
                            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111827' }}>{routeItem._cliente?.nombre_comercial}</Text>
                            {routeItem._cliente?.razon_social && routeItem._cliente.razon_social !== routeItem._cliente.nombre_comercial && (
                                <Text style={{ fontSize: 14, color: '#6B7280', marginTop: 4 }}>{routeItem._cliente?.razon_social}</Text>
                            )}
                        </View>

                        <View style={{ marginBottom: 24 }}>
                            <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#111827', marginBottom: 12 }}>Frecuencia de Visita</Text>
                            <View style={{ flexDirection: 'row' }}>
                                {['SEMANAL', 'QUINCENAL', 'MENSUAL'].map((opt, idx) => (
                                    <TouchableOpacity
                                        key={opt}
                                        onPress={() => setData({ ...data, frecuencia: opt as any })}
                                        style={{
                                            flex: 1,
                                            paddingVertical: 12,
                                            alignItems: 'center',
                                            borderRadius: 12,
                                            borderWidth: 1,
                                            backgroundColor: data.frecuencia === opt ? '#FEF2F2' : 'white',
                                            borderColor: data.frecuencia === opt ? BRAND_COLORS.red : '#D1D5DB',
                                            marginLeft: idx > 0 ? 8 : 0
                                        }}
                                    >
                                        <Text style={{
                                            fontWeight: 'bold',
                                            color: data.frecuencia === opt ? BRAND_COLORS.red : '#6B7280'
                                        }}>
                                            {opt.charAt(0) + opt.slice(1).toLowerCase()}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <View style={{ marginBottom: 24 }}>
                            <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#111827', marginBottom: 12 }}>Prioridad</Text>
                            <View style={{ flexDirection: 'row' }}>
                                {[
                                    { id: 'ALTA', color: '#EF4444' },
                                    { id: 'MEDIA', color: '#F59E0B' },
                                    { id: 'BAJA', color: '#10B981' }
                                ].map((opt, idx) => (
                                    <TouchableOpacity
                                        key={opt.id}
                                        onPress={() => setData({ ...data, prioridad_visita: opt.id as any })}
                                        style={{
                                            flex: 1,
                                            paddingVertical: 12,
                                            alignItems: 'center',
                                            borderRadius: 12,
                                            borderWidth: data.prioridad_visita === opt.id ? 2 : 1,
                                            backgroundColor: data.prioridad_visita === opt.id ? '#FEF2F2' : 'white',
                                            borderColor: data.prioridad_visita === opt.id ? BRAND_COLORS.red : '#D1D5DB',
                                            marginLeft: idx > 0 ? 8 : 0
                                        }}
                                    >
                                        <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: opt.color, marginBottom: 4 }} />
                                        <Text style={{
                                            fontWeight: 'bold',
                                            color: data.prioridad_visita === opt.id ? '#111827' : '#6B7280'
                                        }}>
                                            {opt.id}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <View style={{ marginBottom: 32 }}>
                            <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#111827', marginBottom: 8 }}>Hora Estimada (HH:MM)</Text>
                            <TouchableOpacity
                                onPress={() => setShowTimePicker(true)}
                                style={{
                                    backgroundColor: '#F9FAFB',
                                    paddingHorizontal: 16,
                                    paddingVertical: 12,
                                    borderRadius: 12,
                                    borderWidth: 1,
                                    borderColor: '#D1D5DB'
                                }}
                            >
                                <Text style={{ fontSize: 18, fontWeight: '500', color: '#111827' }}>
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
                                    display="spinner"
                                    onChange={(event, selectedDate) => {
                                        setShowTimePicker(Platform.OS === 'ios')
                                        if (selectedDate) {
                                            const timeStr = selectedDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
                                            setData({ ...data, hora_estimada_arribo: timeStr })
                                        }
                                    }}
                                />
                            )}
                            <Text style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>Selecciona la hora estimada de visita</Text>
                        </View>
                    </ScrollView>

                    <View style={{ padding: 20, borderTopWidth: 1, borderTopColor: '#E5E7EB' }}>
                        <TouchableOpacity
                            onPress={handleSave}
                            style={{
                                backgroundColor: BRAND_COLORS.red,
                                borderRadius: 12,
                                paddingVertical: 16,
                                alignItems: 'center'
                            }}
                        >
                            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>Guardar Cambios</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    )
}

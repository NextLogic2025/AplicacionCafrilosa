import React, { useState } from 'react'
import { View, Text, TextInput, Pressable, ScrollView, ActivityIndicator, Alert } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { BRAND_COLORS } from '@cafrilosa/shared-types'
import { Header } from '../../../components/ui/Header'
import { SupportService } from '../../../services/api/SupportService'

export function ClientCreateTicketScreen() {
    const navigation = useNavigation()
    const [subject, setSubject] = useState('')
    const [description, setDescription] = useState('')
    const [submitting, setSubmitting] = useState(false)

    const handleSubmit = async () => {
        if (!subject.trim() || !description.trim()) {
            Alert.alert('Campos incompletos', 'Por favor completa el asunto y la descripción.')
            return
        }

        setSubmitting(true)
        try {
            await SupportService.createTicket({
                subject,
                description,
                attachmentUrl: '' // Placeholder
            })
            Alert.alert('Éxito', 'Ticket creado correctamente', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ])
        } catch (error) {
            Alert.alert('Error', 'No se pudo crear el ticket. Inténtalo de nuevo.')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <View className="flex-1 bg-neutral-50">
            <Header title="Nuevo Ticket" variant="standard" onBackPress={() => navigation.goBack()} />

            <ScrollView className="flex-1 px-5 pt-6" showsVerticalScrollIndicator={false}>
                <View className="mb-6">
                    <Text className="text-neutral-500 text-xs font-bold uppercase mb-2 ml-1">Tipo de Ticket</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                        {['Entrega', 'Facturación', 'Incidencia General'].map((t) => (
                            <Pressable
                                key={t}
                                onPress={() => setSubject(t)} // Using subject as type for now or add new state
                                className={`px-4 py-2 rounded-full mr-2 border ${subject === t ? 'bg-brand-red border-brand-red' : 'bg-white border-neutral-200'}`}
                            >
                                <Text className={`font-bold text-xs ${subject === t ? 'text-white' : 'text-neutral-600'}`}>{t}</Text>
                            </Pressable>
                        ))}
                    </ScrollView>
                </View>

                <View className="mb-6">
                    <Text className="text-neutral-500 text-xs font-bold uppercase mb-2 ml-1">Asunto</Text>
                    <TextInput
                        className="bg-white border border-neutral-200 rounded-xl px-4 py-3 text-neutral-900 font-medium"
                        placeholder="Ej. Error en la factura #123"
                        placeholderTextColor="#9CA3AF"
                        value={subject}
                        onChangeText={setSubject}
                    />
                </View>

                <View className="mb-6">
                    <Text className="text-neutral-500 text-xs font-bold uppercase mb-2 ml-1">Descripción</Text>
                    <TextInput
                        className="bg-white border border-neutral-200 rounded-xl px-4 py-3 text-neutral-900 text-base h-32"
                        placeholder="Describe tu problema en detalle..."
                        placeholderTextColor="#9CA3AF"
                        multiline
                        textAlignVertical="top"
                        value={description}
                        onChangeText={setDescription}
                    />
                </View>

                <View className="mb-8">
                    <Text className="text-neutral-500 text-xs font-bold uppercase mb-2 ml-1">Evidencia (Opcional)</Text>
                    <Pressable className="bg-white border border-neutral-200 border-dashed rounded-xl h-24 items-center justify-center active:bg-neutral-50">
                        <View className="bg-neutral-100 p-2 rounded-full mb-1">
                            <Ionicons name="camera-outline" size={24} color="#6B7280" />
                        </View>
                        <Text className="text-neutral-400 text-xs font-medium">Adjuntar Foto</Text>
                    </Pressable>
                </View>

                <Pressable
                    onPress={handleSubmit}
                    disabled={submitting}
                    className={`rounded-2xl py-4 items-center shadow-lg shadow-red-500/20 ${submitting ? 'bg-red-300' : 'bg-brand-red active:bg-red-700'}`}
                >
                    {submitting ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text className="text-white font-bold text-lg">Crear Ticket</Text>
                    )}
                </Pressable>
            </ScrollView>
        </View>
    )
}

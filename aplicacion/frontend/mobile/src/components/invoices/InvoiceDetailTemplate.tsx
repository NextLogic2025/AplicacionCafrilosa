import React, { useEffect, useState } from 'react'
import { View, Text, ScrollView, ActivityIndicator, Pressable, Alert } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { BRAND_COLORS } from '../../shared/types'
import { Header } from '../ui/Header'
import { InvoiceService, Invoice } from '../../services/api/InvoiceService'

interface InvoiceDetailTemplateProps {
    invoiceId: string
    role?: 'client' | 'supervisor' | 'warehouse' | 'driver'
}

export function InvoiceDetailTemplate({ invoiceId, role }: InvoiceDetailTemplateProps) {
    const navigation = useNavigation()
    const [invoice, setInvoice] = useState<Invoice | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchDetail = async () => {
            setLoading(true)
            try {
                const data = await InvoiceService.getInvoiceById(invoiceId)
                setInvoice(data)
            } catch (err) {
                console.error('Error fetching invoice detail', err)
            } finally {
                setLoading(false)
            }
        }
        if (invoiceId) fetchDetail()
    }, [invoiceId])

    const handleDownload = () => {
        if (!invoice?.pdfUrl) {
            Alert.alert('Error', 'No hay URL de PDF disponible para esta factura.')
            return
        }
        // TODO: Implementar lógica de abrir URL o descargar
        Alert.alert('Descarga', 'Abriendo documento PDF: ' + invoice.number)
    }

    if (loading) {
        return (
            <View className="flex-1 bg-neutral-50 justify-center">
                <ActivityIndicator color={BRAND_COLORS.red} size="large" />
            </View>
        )
    }

    if (!invoice) {
        return (
            <View className="flex-1 bg-neutral-50">
                <Header title="Detalle Factura" variant="standard" onBackPress={() => navigation.goBack()} />
                <View className="flex-1 items-center justify-center p-8">
                    <Ionicons name="document-text-outline" size={48} color="#D1D5DB" />
                    <Text className="text-neutral-500 mt-4 text-center">No se encontró la factura solicitada.</Text>
                </View>
            </View>
        )
    }

    return (
        <View className="flex-1 bg-neutral-50">
            <Header title={`Factura ${invoice.number}`} variant="standard" onBackPress={() => navigation.goBack()} />

            <ScrollView className="flex-1 px-5 pt-6">
                {/* Cabecera Factura */}
                <View className="bg-white rounded-2xl p-5 mb-6 shadow-sm shadow-black/5 border border-neutral-100 items-center">
                    <Text className="text-neutral-500 text-xs font-bold uppercase tracking-wider mb-2">Total a Pagar</Text>
                    <Text className="text-neutral-900 font-extrabold text-4xl mb-4">${invoice.balance.toFixed(2)}</Text>

                    <View className="flex-row gap-2">
                        <View className={`px-3 py-1.5 rounded-lg ${invoice.status === 'paid' ? 'bg-green-100' : 'bg-neutral-100'}`}>
                            <Text className={`font-bold uppercase text-xs ${invoice.status === 'paid' ? 'text-green-800' : 'text-neutral-600'}`}>
                                {invoice.status === 'paid' ? 'PAGADO' : 'PENDIENTE'}
                            </Text>
                        </View>
                        <View className="bg-neutral-100 px-3 py-1.5 rounded-lg">
                            <Text className="text-neutral-600 font-medium text-xs">Vence: {new Date(invoice.dueDate).toLocaleDateString()}</Text>
                        </View>
                    </View>
                </View>

                {/* Info Cliente (Solo si no soy cliente veo esto más relevante) */}
                {role !== 'client' && invoice.clientName && (
                    <View className="bg-white rounded-2xl p-5 mb-6 shadow-sm shadow-black/5 border border-neutral-100">
                        <Text className="text-neutral-900 font-bold text-lg mb-3">Cliente</Text>
                        <View className="flex-row items-center">
                            <View className="w-10 h-10 bg-indigo-50 rounded-full items-center justify-center mr-3">
                                <Ionicons name="person" size={20} color="#4F46E5" />
                            </View>
                            <View>
                                <Text className="text-neutral-900 font-bold">{invoice.clientName}</Text>
                                {invoice.rucCliente && <Text className="text-neutral-500 text-xs">{invoice.rucCliente}</Text>}
                            </View>
                        </View>
                    </View>
                )}

                {/* Detalles Generales */}
                <View className="bg-white rounded-2xl p-5 mb-6 shadow-sm shadow-black/5 border border-neutral-100">
                    <Text className="text-neutral-900 font-bold text-lg mb-4">Información</Text>

                    <View className="flex-row justify-between py-3 border-b border-neutral-100">
                        <Text className="text-neutral-500">Número</Text>
                        <Text className="text-neutral-900 font-medium">{invoice.number}</Text>
                    </View>
                    <View className="flex-row justify-between py-3 border-b border-neutral-100">
                        <Text className="text-neutral-500">Fecha Emisión</Text>
                        <Text className="text-neutral-900 font-medium">{new Date(invoice.issueDate).toLocaleDateString()}</Text>
                    </View>
                    <View className="flex-row justify-between py-3">
                        <Text className="text-neutral-500">Total Factura</Text>
                        <Text className="text-neutral-900 font-bold">${invoice.total.toFixed(2)}</Text>
                    </View>
                </View>

                {/* Lista de Items (Si existiera en el modelo detallado) */}
                {invoice.detalles && invoice.detalles.length > 0 && (
                    <View className="bg-white rounded-2xl p-5 mb-6 shadow-sm shadow-black/5 border border-neutral-100">
                        <Text className="text-neutral-900 font-bold text-lg mb-4">Detalle de Productos</Text>
                        {invoice.detalles.map((item, idx) => (
                            <View key={idx} className="flex-row justify-between py-2 border-b border-neutral-50 last:border-0">
                                <View className="flex-1 pr-4">
                                    <Text className="text-neutral-900 text-sm font-medium">{item.descripcion}</Text>
                                    <Text className="text-neutral-500 text-xs">{item.cantidad} x ${item.precio_unitario.toFixed(2)}</Text>
                                </View>
                                <Text className="text-neutral-900 font-bold text-sm">${item.total_linea.toFixed(2)}</Text>
                            </View>
                        ))}
                    </View>
                )}

                <Pressable
                    onPress={handleDownload}
                    className="flex-row items-center justify-center bg-white border border-brand-red rounded-xl py-4 mb-4"
                >
                    <Ionicons name="download-outline" size={24} color={BRAND_COLORS.red} />
                    <Text className="text-brand-red font-bold text-base ml-2">Descargar PDF</Text>
                </Pressable>

                <View className="h-8" />
            </ScrollView>
        </View>
    )
}

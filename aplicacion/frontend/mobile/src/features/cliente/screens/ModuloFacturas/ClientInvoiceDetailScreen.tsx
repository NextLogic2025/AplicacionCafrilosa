import React, { useEffect, useState } from 'react'
import { View, Text, ScrollView, ActivityIndicator, Pressable, Alert } from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { BRAND_COLORS } from '../../../../shared/types'
import { Header } from '../../../../components/ui/Header'
import { InvoiceService, Invoice } from '../../../../services/api/InvoiceService'

export function ClientInvoiceDetailScreen() {
    const navigation = useNavigation()
    const route = useRoute()
    // @ts-ignore
    const { invoiceId } = route.params || {}
    const [invoice, setInvoice] = useState<Invoice | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchDetail = async () => {
            try {
              
                setInvoice(null) 
            } finally {
                setLoading(false)
            }
        }
        fetchDetail()
    }, [invoiceId])

    const handleDownload = () => {
        Alert.alert('Descarga', 'Iniciando descarga del comprobante...')
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
            <Header title="Detalle Factura" variant="standard" onBackPress={() => navigation.goBack()} />

            <ScrollView className="flex-1 px-5 pt-6">
                {/* Cabecera Factura */}
                <View className="bg-white rounded-2xl p-5 mb-6 shadow-sm shadow-black/5 border border-neutral-100 items-center">
                    <Text className="text-neutral-500 text-xs font-bold uppercase tracking-wider mb-2">Total a Pagar</Text>
                    <Text className="text-neutral-900 font-extrabold text-4xl mb-4">${invoice.balance.toFixed(2)}</Text>

                    <View className="bg-neutral-100 px-4 py-2 rounded-lg">
                        <Text className="text-neutral-600 font-medium">Vence: {new Date(invoice.dueDate).toLocaleDateString()}</Text>
                    </View>
                </View>

                {/* Detalles */}
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
                    <View className="flex-row justify-between py-3 border-b border-neutral-100">
                        <Text className="text-neutral-500">Estado</Text>
                        <Text className="text-neutral-900 font-bold uppercase">{invoice.status}</Text>
                    </View>
                    <View className="flex-row justify-between py-3">
                        <Text className="text-neutral-500">Monto Original</Text>
                        <Text className="text-neutral-900 font-bold">${invoice.total.toFixed(2)}</Text>
                    </View>
                </View>

                <Pressable
                    onPress={handleDownload}
                    className="flex-row items-center justify-center bg-white border border-brand-red rounded-xl py-4 mb-4"
                >
                    <Ionicons name="download-outline" size={24} color={BRAND_COLORS.red} />
                    <Text className="text-brand-red font-bold text-base ml-2">Descargar PDF</Text>
                </Pressable>

            </ScrollView>
        </View>
    )
}

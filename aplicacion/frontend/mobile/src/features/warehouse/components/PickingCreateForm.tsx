import React, { useEffect, useState } from 'react'
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

import { Header } from '../../../components/ui/Header'
import { TextField } from '../../../components/ui/TextField'
import { PrimaryButton } from '../../../components/ui/PrimaryButton'
import { PickerModal, type PickerOption } from '../../../components/ui/PickerModal'
import { FeedbackModal, type FeedbackType } from '../../../components/ui/FeedbackModal'
import { CatalogService } from '../../../services/api/CatalogService'
import { PickingService, type CreatePickingPayload } from '../../../services/api/PickingService'
import { getUserFriendlyMessage } from '../../../utils/errorMessages'
import { BRAND_COLORS } from '../../../shared/types'

type ItemRow = { id: string; productoId?: string; cantidad: string }

type Props = {
    onBack: () => void
    onSaved: () => void
}

export function PickingCreateForm({ onBack, onSaved }: Props) {
    const [pedidoId, setPedidoId] = useState('')
    const [bodegueroId, setBodegueroId] = useState('')
    const [items, setItems] = useState<ItemRow[]>([{ id: 'item-1', cantidad: '', productoId: undefined }])
    const [products, setProducts] = useState<PickerOption[]>([])
    const [activePicker, setActivePicker] = useState<string | null>(null)

    const [saving, setSaving] = useState(false)
    const [loading, setLoading] = useState(false)
    const [feedback, setFeedback] = useState<{ visible: boolean; type: FeedbackType; title: string; message: string }>({
        visible: false,
        type: 'info',
        title: '',
        message: '',
    })

    useEffect(() => {
        loadProducts()
    }, [])

    const loadProducts = async () => {
        try {
            setLoading(true)
            const data = await CatalogService.getProducts()
            setProducts(
                (data || []).map((p) => ({
                    id: String(p.id),
                    label: p.nombre || p.codigo_sku || 'Producto',
                    description: p.codigo_sku ? `SKU: ${p.codigo_sku}` : undefined,
                    icon: 'cube',
                })),
            )
        } catch (error) {
            setFeedback({
                visible: true,
                type: 'error',
                title: 'No se pudieron cargar productos',
                message: getUserFriendlyMessage(error, 'LOAD_ERROR'),
            })
        } finally {
            setLoading(false)
        }
    }

    const updateItem = (id: string, patch: Partial<ItemRow>) => {
        setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)))
    }

    const addItemRow = () => {
        setItems((prev) => prev.concat({ id: `item-${prev.length + 1}`, cantidad: '', productoId: undefined }))
    }

    const removeItemRow = (id: string) => {
        setItems((prev) => (prev.length > 1 ? prev.filter((it) => it.id !== id) : prev))
    }

    const handleSubmit = async () => {
        if (!pedidoId.trim()) {
            setFeedback({ visible: true, type: 'warning', title: 'Pedido requerido', message: 'Ingresa el pedido asociado.' })
            return
        }
        const validItems = items
            .map((it) => ({
                productoId: it.productoId,
                cantidad: Number(it.cantidad),
            }))
            .filter((it) => it.productoId && !Number.isNaN(it.cantidad) && it.cantidad > 0) as Array<{ productoId: string; cantidad: number }>

        if (validItems.length === 0) {
            setFeedback({ visible: true, type: 'warning', title: 'Faltan productos', message: 'Agrega al menos un producto con cantidad.' })
            return
        }

        const payload: CreatePickingPayload = {
            pedidoId: pedidoId.trim(),
            items: validItems.map((it) => ({
                productoId: it.productoId!,
                cantidadSolicitada: it.cantidad,
            })),
        }

        setSaving(true)
        try {
            const created = await PickingService.create(payload)
            if (bodegueroId.trim()) {
                try {
                    await PickingService.assign(created.id, bodegueroId.trim())
                } catch (assignErr) {
                    setFeedback({
                        visible: true,
                        type: 'warning',
                        title: 'Picking creado, asignacion fallida',
                        message: getUserFriendlyMessage(assignErr, 'UPDATE_ERROR'),
                    })
                    onSaved()
                    return
                }
            }
            setFeedback({ visible: true, type: 'success', title: 'Picking creado', message: 'Se genero la orden de picking.' })
        } catch (error) {
            setFeedback({
                visible: true,
                type: 'error',
                title: 'No se pudo crear',
                message: getUserFriendlyMessage(error, 'CREATE_ERROR'),
            })
        } finally {
            setSaving(false)
        }
    }

    return (
        <KeyboardAvoidingView className="flex-1 bg-neutral-50" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <Header title="Nuevo picking" variant="standard" onBackPress={onBack} />

            <ScrollView className="flex-1" contentContainerStyle={{ padding: 20, paddingBottom: 32 }}>
                <View className="bg-white p-5 rounded-3xl border border-neutral-100 shadow-sm gap-4">
                    <Text className="text-lg font-extrabold text-neutral-900">Datos generales</Text>

                    <TextField
                        label="Pedido ID"
                        placeholder="ID del pedido"
                        value={pedidoId}
                        onChangeText={setPedidoId}
                    />

                    <TextField
                        label="Bodeguero (opcional)"
                        placeholder="UUID bodeguero"
                        value={bodegueroId}
                        onChangeText={setBodegueroId}
                    />
                </View>

                <View className="bg-white p-5 rounded-3xl border border-neutral-100 shadow-sm gap-3 mt-4">
                    <View className="flex-row justify-between items-center">
                        <Text className="text-lg font-extrabold text-neutral-900">Items</Text>
                        <TouchableOpacity
                            onPress={addItemRow}
                            className="w-9 h-9 rounded-full bg-red-50 items-center justify-center"
                            disabled={saving}
                        >
                            <Ionicons name="add" size={20} color={BRAND_COLORS.red} />
                        </TouchableOpacity>
                    </View>

                    {items.map((row) => (
                        <View key={row.id} className="border border-neutral-200 rounded-2xl p-4 gap-3">
                            <TouchableOpacity
                                className="p-3 rounded-xl border border-neutral-200 bg-neutral-50 flex-row items-center justify-between"
                                onPress={() => setActivePicker(row.id)}
                                activeOpacity={0.7}
                                disabled={saving}
                            >
                                <View>
                                    <Text className="text-xs text-neutral-500 font-semibold uppercase">Producto</Text>
                                    <Text className="text-base font-bold text-neutral-900 mt-1">
                                        {row.productoId
                                            ? products.find((p) => p.id === row.productoId)?.label || `Producto ${row.productoId}`
                                            : 'Seleccionar'}
                                    </Text>
                                </View>
                                <Ionicons name="chevron-down" size={18} color="#6B7280" />
                            </TouchableOpacity>

                            <TextField
                                label="Cantidad"
                                placeholder="Ej. 5"
                                value={row.cantidad}
                                onChangeText={(v) => updateItem(row.id, { cantidad: v })}
                                keyboardType="numeric"
                            />

                            {items.length > 1 ? (
                                <TouchableOpacity
                                    onPress={() => removeItemRow(row.id)}
                                    className="self-end px-3 py-2 rounded-xl bg-neutral-100 border border-neutral-200"
                                    disabled={saving}
                                >
                                    <Text className="text-xs font-bold text-neutral-600">Eliminar</Text>
                                </TouchableOpacity>
                            ) : null}
                        </View>
                    ))}
                </View>

                <PrimaryButton
                    title={saving ? 'Creando...' : 'Crear picking'}
                    onPress={handleSubmit}
                    loading={saving || loading}
                    disabled={saving}
                    style={{ marginTop: 16 }}
                />
            </ScrollView>

            <PickerModal
                visible={Boolean(activePicker)}
                title="Selecciona producto"
                options={products}
                selectedId={activePicker ? items.find((it) => it.id === activePicker)?.productoId : undefined}
                onSelect={(id) => {
                    if (activePicker) updateItem(activePicker, { productoId: String(id) })
                    setActivePicker(null)
                }}
                onClose={() => setActivePicker(null)}
                infoIcon="cube-outline"
                infoColor={BRAND_COLORS.red}
            />

            <FeedbackModal
                visible={feedback.visible}
                type={feedback.type}
                title={feedback.title}
                message={feedback.message}
                onClose={() => {
                    setFeedback((prev) => ({ ...prev, visible: false }))
                    if (feedback.type === 'success') onSaved()
                }}
            />
        </KeyboardAvoidingView>
    )
}

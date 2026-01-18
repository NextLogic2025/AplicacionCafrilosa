import React, { useEffect, useMemo, useState } from 'react'
import { View, Text, Pressable, Alert } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'

import { Header } from '../../../components/ui/Header'
import { SearchBar } from '../../../components/ui/SearchBar'
import { GenericList } from '../../../components/ui/GenericList'
import { FeedbackModal, type FeedbackType } from '../../../components/ui/FeedbackModal'
import { ToggleSwitch } from '../../../components/ui/ToggleSwitch'
import { AlmacenService, type Almacen } from '../../../services/api/AlmacenService'
import { getUserFriendlyMessage } from '../../../utils/errorMessages'
import { BRAND_COLORS } from '../../../shared/types'

type Props = {
    title?: string
    onBack?: () => void
    onCreate?: () => void
    onOpen?: (id: number) => void
    allowToggle?: boolean
    refreshToken?: number
}

export function AlmacenesList({
    title = 'Almacenes',
    onBack,
    onCreate,
    onOpen,
    allowToggle = false,
    refreshToken,
}: Props) {
    const [search, setSearch] = useState('')
    const [loading, setLoading] = useState(false)
    const [items, setItems] = useState<Almacen[]>([])
    const [modalState, setModalState] = useState<{
        visible: boolean
        type: FeedbackType
        title: string
        message: string
    }>({ visible: false, type: 'info', title: '', message: '' })
    const [togglingId, setTogglingId] = useState<number | null>(null)

    const loadData = async () => {
        setLoading(true)
        try {
            const data = await AlmacenService.list()
            setItems(Array.isArray(data) ? data : [])
        } catch (error) {
            setModalState({
                visible: true,
                type: 'error',
                title: 'No se pudo cargar',
                message: getUserFriendlyMessage(error, 'LOAD_ERROR'),
            })
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadData()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [refreshToken])

    const filtered = useMemo(() => {
        if (!search) return items
        const term = search.toLowerCase()
        return items.filter((a) =>
            [a.nombre, a.codigoRef, a.direccionFisica]
                .filter(Boolean)
                .some((value) => String(value).toLowerCase().includes(term)),
        )
    }, [items, search])

    const toggleActivo = async (item: Almacen, value: boolean) => {
        if (!allowToggle) return
        setTogglingId(item.id)
        try {
            await AlmacenService.update(item.id, { activo: value })
            setItems((prev) => prev.map((a) => (a.id === item.id ? { ...a, activo: value } : a)))
            setModalState({
                visible: true,
                type: 'success',
                title: value ? 'Almacen activado' : 'Almacen desactivado',
                message: 'El estado se actualizo correctamente.',
            })
        } catch (error) {
            setModalState({
                visible: true,
                type: 'error',
                title: 'No se pudo actualizar',
                message: getUserFriendlyMessage(error, 'UPDATE_ERROR'),
            })
        } finally {
            setTogglingId(null)
        }
    }

    const handleTogglePress = (item: Almacen) => {
        if (!allowToggle) return
        if (item.activo) {
            Alert.alert('Desactivar almacén', 'Se desactivará el almacén. ¿Quieres continuar?', [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Sí, desactivar', style: 'destructive', onPress: () => toggleActivo(item, false) },
            ])
        } else {
            toggleActivo(item, true)
        }
    }

    return (
        <View className="flex-1 bg-neutral-50">
            <Header title={title} variant="standard" onBackPress={onBack} />

            <View className="bg-white px-5 pb-4 pt-5 border-b border-neutral-100 shadow-sm shadow-black/5">
                <View className="flex-row items-center gap-3">
                    <SearchBar
                        placeholder="Buscar almacen..."
                        value={search}
                        onChangeText={setSearch}
                        onClear={() => setSearch('')}
                        style={{ flex: 1 }}
                    />
                    {onCreate ? (
                        <Pressable
                            onPress={onCreate}
                            className="rounded-2xl shadow-md shadow-black/15"
                            style={{ width: 52, height: 52, overflow: 'hidden' }}
                        >
                            <LinearGradient
                                colors={[BRAND_COLORS.red, (BRAND_COLORS as any).red700 || BRAND_COLORS.red]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
                            >
                                <Ionicons name="add" size={26} color="#fff" />
                            </LinearGradient>
                        </Pressable>
                    ) : null}
                </View>
            </View>

            <GenericList
                items={filtered}
                isLoading={loading}
                onRefresh={loadData}
                emptyState={{
                    icon: 'business-outline',
                    title: 'No hay almacenes',
                    message: 'Crea tu primer almacen para organizar el inventario.',
                }}
                renderItem={(item) => (
                    <Pressable
                        onPress={onOpen ? () => onOpen(item.id) : undefined}
                        className="bg-white rounded-2xl border border-neutral-100 shadow-sm px-4 py-4 mb-4"
                        style={{ elevation: 3 }}
                    >
                        <View className="flex-row justify-between items-start">
                            <View className="flex-1 mr-3">
                                <Text className="text-neutral-900 font-extrabold text-lg" numberOfLines={1}>
                                    {item.nombre}
                                </Text>
                                <Text className="text-neutral-500 text-xs mt-1" numberOfLines={1}>
                                    Codigo ref: {item.codigoRef || 'N/D'}
                                </Text>
                                <View className="flex-row gap-2 mt-3 flex-wrap">
                                    <Badge label={item.requiereFrio ? 'Requiere frio' : 'Sin frio'} tone={item.requiereFrio ? 'warn' : 'muted'} />
                                    <Badge label={item.activo ? 'Activo' : 'Inactivo'} tone={item.activo ? 'success' : 'danger'} />
                                </View>
                            </View>
                            <View className="items-end gap-2">
                                {allowToggle ? (
                                    <View className="flex-row items-center gap-2">
                                        <Text className="text-xs text-neutral-500">{item.activo ? 'Activo' : 'Inactivo'}</Text>
                                        <ToggleSwitch
                                            checked={item.activo}
                                            onToggle={() => handleTogglePress(item)}
                                            disabled={togglingId === item.id}
                                            colorOn={BRAND_COLORS.red}
                                            colorOff="#E2E8F0"
                                            size="md"
                                        />
                                    </View>
                                ) : null}
                            </View>
                        </View>
                    </Pressable>
                )}
            />

            <FeedbackModal
                visible={modalState.visible}
                type={modalState.type}
                title={modalState.title}
                message={modalState.message}
                onClose={() => setModalState((prev) => ({ ...prev, visible: false }))}
            />
        </View>
    )
}

function Badge({ label, tone }: { label: string; tone: 'success' | 'danger' | 'warn' | 'muted' }) {
    const styles: Record<'success' | 'danger' | 'warn' | 'muted', { bg: string; text: string; border: string }> = {
        success: { bg: '#ECFDF3', text: '#15803D', border: '#BBF7D0' },
        danger: { bg: '#FEF2F2', text: '#B91C1C', border: '#FECACA' },
        warn: { bg: '#FFF7ED', text: '#EA580C', border: '#FED7AA' },
        muted: { bg: '#F8FAFC', text: '#475569', border: '#E2E8F0' },
    }
    const palette = styles[tone]
    return (
        <View
            className="px-2.5 py-1 rounded-full"
            style={{ backgroundColor: palette.bg, borderColor: palette.border, borderWidth: 1 }}
        >
            <Text className="text-[11px] font-semibold uppercase" style={{ color: palette.text }}>
                {label}
            </Text>
        </View>
    )
}

import React, { useState } from 'react'
import { View, Text, Modal, Pressable, ActivityIndicator } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { BRAND_COLORS } from '../../shared/types'

export interface ConfirmationModalProps {
    visible: boolean
    title: string
    message: string
    /** Texto del botón de confirmar (default: "Confirmar") */
    confirmText?: string
    /** Texto del botón de cancelar (default: "Cancelar") */
    cancelText?: string
    /** Color del botón de confirmar (default: BRAND_COLORS.red) */
    confirmColor?: string
    /** Ícono a mostrar (default: "alert-circle-outline") */
    icon?: keyof typeof Ionicons.glyphMap
    /** Color del ícono (default: confirmColor) */
    iconColor?: string
    /** Si el botón de confirmar es destructivo (cambia color a rojo) */
    isDestructive?: boolean
    /** Callback al confirmar (puede ser async) */
    onConfirm: () => void | Promise<void>
    /** Callback al cancelar */
    onCancel: () => void
}

/**
 * Modal de confirmación reutilizable con soporte para acciones async
 * 
 * @example
 * ```tsx
 * <ConfirmationModal
 *   visible={showConfirm}
 *   title="¿Tomar esta orden?"
 *   message="Se te asignará esta orden de picking."
 *   confirmText="Tomar Orden"
 *   onConfirm={async () => await handleTakeOrder()}
 *   onCancel={() => setShowConfirm(false)}
 * />
 * ```
 */
export function ConfirmationModal({
    visible,
    title,
    message,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    confirmColor = BRAND_COLORS.red,
    icon = 'alert-circle-outline',
    iconColor,
    isDestructive = false,
    onConfirm,
    onCancel,
}: ConfirmationModalProps) {
    const [isProcessing, setIsProcessing] = useState(false)

    const handleConfirm = async () => {
        setIsProcessing(true)
        try {
            await onConfirm()
        } finally {
            setIsProcessing(false)
        }
    }

    const finalConfirmColor = isDestructive ? '#EF4444' : confirmColor
    const finalIconColor = iconColor || finalConfirmColor

    return (
        <Modal
            visible={visible}
            animationType="fade"
            transparent={true}
            onRequestClose={onCancel}
        >
            <View className="flex-1 bg-black/50 justify-center items-center px-6">
                {/* Modal Card */}
                <View className="bg-white rounded-3xl w-full max-w-sm overflow-hidden" style={{ elevation: 10 }}>
                    {/* Header con ícono */}
                    <View className="items-center pt-8 pb-4 px-6">
                        <View
                            className="w-16 h-16 rounded-full items-center justify-center mb-4"
                            style={{ backgroundColor: `${finalIconColor}15` }}
                        >
                            <Ionicons name={icon} size={32} color={finalIconColor} />
                        </View>
                        <Text className="text-neutral-900 font-bold text-xl text-center">
                            {title}
                        </Text>
                    </View>

                    {/* Mensaje */}
                    <View className="px-6 pb-6">
                        <Text className="text-neutral-600 text-base text-center leading-6">
                            {message}
                        </Text>
                    </View>

                    {/* Botones */}
                    <View className="flex-row border-t border-neutral-100">
                        {/* Cancelar */}
                        <Pressable
                            onPress={onCancel}
                            disabled={isProcessing}
                            className="flex-1 py-4 items-center justify-center border-r border-neutral-100 active:bg-neutral-50"
                        >
                            <Text className={`text-base font-semibold ${isProcessing ? 'text-neutral-400' : 'text-neutral-600'}`}>
                                {cancelText}
                            </Text>
                        </Pressable>

                        {/* Confirmar */}
                        <Pressable
                            onPress={handleConfirm}
                            disabled={isProcessing}
                            className="flex-1 py-4 items-center justify-center active:bg-neutral-50"
                        >
                            {isProcessing ? (
                                <ActivityIndicator size="small" color={finalConfirmColor} />
                            ) : (
                                <Text
                                    className="text-base font-bold"
                                    style={{ color: finalConfirmColor }}
                                >
                                    {confirmText}
                                </Text>
                            )}
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    )
}

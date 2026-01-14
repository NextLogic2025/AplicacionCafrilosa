import React from 'react'
import { Modal, View, Text, TouchableOpacity, Dimensions } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { BRAND_COLORS } from '../../shared/types'

interface SuccessModalProps {
    visible: boolean
    onClose: () => void
    title: string
    message: string
    primaryButtonText?: string
    onPrimaryPress?: () => void
    secondaryButtonText?: string
    onSecondaryPress?: () => void
}

/**
 * SuccessModal - Modal de éxito con diseño moderno
 * 
 * Reemplaza los Alert nativos feos con un modal
 * más profesional y personalizable
 */
export function SuccessModal({
    visible,
    onClose,
    title,
    message,
    primaryButtonText = 'Aceptar',
    onPrimaryPress,
    secondaryButtonText,
    onSecondaryPress
}: SuccessModalProps) {
    const handlePrimaryPress = () => {
        onPrimaryPress?.()
        onClose()
    }

    const handleSecondaryPress = () => {
        onSecondaryPress?.()
        onClose()
    }

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
            statusBarTranslucent={true}
        >
            <View className="flex-1 justify-center items-center bg-black/50 px-8">
                <View className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl">
                    {/* Icon Circle */}
                    <View className="items-center pt-8 pb-4">
                        <View 
                            className="w-20 h-20 rounded-full items-center justify-center"
                            style={{ backgroundColor: '#10B98120' }}
                        >
                            <View 
                                className="w-16 h-16 rounded-full items-center justify-center"
                                style={{ backgroundColor: '#10B981' }}
                            >
                                <Ionicons name="checkmark" size={40} color="white" />
                            </View>
                        </View>
                    </View>

                    {/* Content */}
                    <View className="px-6 pb-6">
                        <Text className="text-neutral-900 font-bold text-2xl text-center mb-3">
                            {title}
                        </Text>
                        <Text className="text-neutral-600 text-base text-center leading-6 mb-6">
                            {message}
                        </Text>

                        {/* Primary Button */}
                        <TouchableOpacity
                            onPress={handlePrimaryPress}
                            className="bg-brand-red py-4 rounded-xl mb-2"
                            activeOpacity={0.8}
                        >
                            <Text className="text-white font-bold text-center text-base">
                                {primaryButtonText}
                            </Text>
                        </TouchableOpacity>

                        {/* Secondary Button (Optional) */}
                        {secondaryButtonText && (
                            <TouchableOpacity
                                onPress={handleSecondaryPress}
                                className="bg-neutral-100 py-4 rounded-xl"
                                activeOpacity={0.8}
                            >
                                <Text className="text-neutral-700 font-semibold text-center text-base">
                                    {secondaryButtonText}
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </View>
        </Modal>
    )
}

import React from 'react'
import { Modal, View, Text, TouchableOpacity, Dimensions } from 'react-native'
import { Ionicons } from '@expo/vector-icons'


export type FeedbackType = 'success' | 'error' | 'warning' | 'info'

interface FeedbackModalProps {
    visible: boolean
    type: FeedbackType
    title: string
    message: string
    onClose: () => void
    confirmText?: string
    onConfirm?: () => void
    showCancel?: boolean
    cancelText?: string
}

export const FeedbackModal = ({
    visible,
    type,
    title,
    message,
    onClose,
    confirmText = 'Entendido',
    onConfirm,
    showCancel = false,
    cancelText = 'Cancelar'
}: FeedbackModalProps) => {

    const getConfig = () => {
        switch (type) {
            case 'success':
                return {
                    icon: 'checkmark-circle',
                    color: '#16A34A', // green-600
                    bgColor: '#F0FDF4', // green-50
                }
            case 'error':
                return {
                    icon: 'alert-circle',
                    color: '#DC2626', // red-600
                    bgColor: '#FEF2F2', // red-50
                }
            case 'warning':
                return {
                    icon: 'warning',
                    color: '#D97706', // amber-600
                    bgColor: '#FFFBEB', // amber-50
                }
            case 'info':
            default:
                return {
                    icon: 'information-circle',
                    color: '#2563EB', // blue-600
                    bgColor: '#EFF6FF', // blue-50
                }
        }
    }

    const config = getConfig()

    return (
        <Modal
            transparent
            visible={visible}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View className="flex-1 bg-black/50 justify-center items-center px-6">
                <View className="bg-white w-full rounded-2xl p-6 shadow-xl items-center">
                    {/* Icon Header */}
                    <View
                        className="w-16 h-16 rounded-full items-center justify-center mb-4"
                        style={{ backgroundColor: config.bgColor }}
                    >
                        <Ionicons name={config.icon as any} size={32} color={config.color} />
                    </View>

                    {/* Content */}
                    <Text className="text-xl font-bold text-neutral-900 text-center mb-2">
                        {title}
                    </Text>

                    <Text className="text-base text-neutral-500 text-center mb-6 leading-6">
                        {message}
                    </Text>

                    {/* Actions */}
                    <View className="flex-row gap-3 w-full">
                        {showCancel && (
                            <TouchableOpacity
                                className="flex-1 py-3 rounded-xl border border-neutral-200 items-center justify-center bg-white"
                                onPress={onClose}
                            >
                                <Text className="text-neutral-600 font-semibold text-base">
                                    {cancelText}
                                </Text>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity
                            className="flex-1 py-3 rounded-xl items-center justify-center shadow-sm"
                            style={{ backgroundColor: config.color }}
                            onPress={onConfirm || onClose}
                        >
                            <Text className="text-white font-semibold text-base">
                                {confirmText}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    )
}

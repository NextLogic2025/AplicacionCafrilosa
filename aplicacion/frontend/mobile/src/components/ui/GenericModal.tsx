import React from 'react'
import { Modal, View, Text, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, ModalProps, DimensionValue } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

interface GenericModalProps extends ModalProps {
    visible: boolean
    onClose: () => void
    title?: string
    children: React.ReactNode
    height?: DimensionValue // e.g. '50%', '70%'
}

export function GenericModal({ visible, onClose, title, children, height = 'auto', ...props }: GenericModalProps) {
    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
            statusBarTranslucent={true}
            {...props}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                className="flex-1 justify-end bg-black/50"
            >
                <View
                    className="bg-white rounded-t-3xl w-full"
                    style={{ maxHeight: '90%', height: height === 'auto' ? undefined : height }}
                >
                    {/* Header */}
                    <View className="flex-row justify-between items-center p-5 border-b border-neutral-100">
                        <Text className="text-xl font-bold text-neutral-900">
                            {title}
                        </Text>
                        <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                            <Ionicons name="close" size={24} color="#6B7280" />
                        </TouchableOpacity>
                    </View>

                    {/* Content */}
                    <ScrollView className="p-5" contentContainerStyle={{ paddingBottom: 40 }}>
                        {children}
                    </ScrollView>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    )
}

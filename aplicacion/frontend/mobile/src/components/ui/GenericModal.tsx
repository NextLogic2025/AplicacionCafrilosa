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
                    style={{
                        maxHeight: '90%',
                        height: height === 'auto' ? undefined : height,
                        shadowColor: "#000",
                        shadowOffset: {
                            width: 0,
                            height: -4,
                        },
                        shadowOpacity: 0.15,
                        shadowRadius: 10,
                        elevation: 20,
                    }}
                >
                    {/* Header */}
                    <View className="flex-row justify-between items-center p-5 border-b border-neutral-100">
                        <Text className="text-xl font-bold text-neutral-900 tracking-tight">
                            {title}
                        </Text>
                        <TouchableOpacity
                            onPress={onClose}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            className="bg-neutral-100 p-2 rounded-full"
                        >
                            <Ionicons name="close" size={20} color="#6B7280" />
                        </TouchableOpacity>
                    </View>

                    {/* Content */}
                    <ScrollView className="px-5 pt-2" contentContainerStyle={{ paddingBottom: 40 }}>
                        {children}
                    </ScrollView>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    )
}

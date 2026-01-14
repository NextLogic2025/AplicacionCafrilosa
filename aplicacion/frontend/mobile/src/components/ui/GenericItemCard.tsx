import React from 'react'
import { View, Text, TouchableOpacity, Image, StyleProp, ViewStyle } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { BRAND_COLORS } from '../../shared/types'

interface GenericItemCardProps {
    title: string
    subtitle?: string
    imageUrl?: string
    isActive?: boolean
    onPress: () => void
    onDelete?: () => void
    placeholderIcon?: keyof typeof Ionicons.glyphMap
    style?: StyleProp<ViewStyle>
    // Optional label for the subtitle (e.g., "SKU:")
    subtitleLabel?: string
}

export const GenericItemCard: React.FC<GenericItemCardProps> = ({
    title,
    subtitle,
    imageUrl,
    isActive = true,
    onPress,
    onDelete,
    placeholderIcon = 'image-outline',
    style,
    subtitleLabel
}) => {
    return (
        <TouchableOpacity
            className="flex-row bg-white p-3 mb-3 rounded-2xl shadow-sm border border-neutral-100 items-center"
            activeOpacity={0.7}
            onPress={onPress}
            style={[{ elevation: 2 }, style]}
        >
            {/* Image Section */}
            <View className="w-16 h-16 bg-neutral-50 rounded-xl items-center justify-center mr-4 overflow-hidden border border-neutral-100">
                {imageUrl ? (
                    <Image
                        source={{ uri: imageUrl }}
                        className="w-full h-full"
                        resizeMode="cover"
                    />
                ) : (
                    <Ionicons name={placeholderIcon} size={24} color="#CBD5E1" />
                )}
            </View>

            {/* Content Section */}
            <View className="flex-1 justify-center py-1">
                <View className="flex-row justify-between items-start mb-1">
                    <Text
                        className="font-bold text-neutral-800 text-base flex-1 mr-2 leading-tight"
                        numberOfLines={1}
                    >
                        {title}
                    </Text>
                </View>

                {/* Subtitle and Status Row */}
                <View className="flex-col">
                    {subtitle ? (
                        <Text className="text-neutral-500 text-xs mb-2" numberOfLines={1}>
                            {subtitleLabel ? <Text className="font-semibold">{subtitleLabel} </Text> : null}
                            {subtitle}
                        </Text>
                    ) : null}

                    {/* Status Badge */}
                    <View className="flex-row">
                        <View
                            className={`px-2.5 py-0.5 rounded-full ${isActive ? 'bg-green-50' : 'bg-red-50'}`}
                            style={{ borderWidth: 1, borderColor: isActive ? '#BBF7D0' : '#FECACA' }}
                        >
                            <Text
                                className={`text-[9px] font-bold uppercase tracking-wider ${isActive ? 'text-green-700' : 'text-red-600'}`}
                            >
                                {isActive ? 'Activo' : 'Inactivo'}
                            </Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* Actions */}
            <View className="flex-row items-center ml-2">
                {onDelete && (
                    <TouchableOpacity
                        className="p-2 bg-neutral-50 rounded-full mr-1"
                        onPress={onDelete}
                    >
                        <Ionicons name="trash-outline" size={18} color={BRAND_COLORS.red || '#EF4444'} />
                    </TouchableOpacity>
                )}
                <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
            </View>
        </TouchableOpacity>
    )
}

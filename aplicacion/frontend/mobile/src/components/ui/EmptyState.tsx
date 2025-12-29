import { Ionicons } from '@expo/vector-icons'
import { Text, View } from 'react-native'

import { PrimaryButton } from './PrimaryButton'

type Props = {
    icon?: keyof typeof Ionicons.glyphMap
    title: string
    description?: string
    actionLabel?: string
    onAction?: () => void
    style?: any
}

export function EmptyState({
    icon = 'file-tray-outline',
    title,
    description,
    actionLabel,
    onAction,
    style
}: Props) {
    return (
        <View className="items-center justify-center py-10 px-6" style={style}>
            <View className="bg-neutral-100 w-20 h-20 rounded-full items-center justify-center mb-4">
                <Ionicons name={icon} size={40} color="#9CA3AF" />
            </View>

            <Text className="text-lg font-bold text-neutral-900 text-center mb-2">
                {title}
            </Text>

            {description && (
                <Text className="text-neutral-500 text-center text-sm leading-5 max-w-[280px] mb-6">
                    {description}
                </Text>
            )}

            {actionLabel && onAction && (
                <PrimaryButton
                    title={actionLabel}
                    onPress={onAction}
                    style={{ minWidth: 160 }}
                />
            )}
        </View>
    )
}

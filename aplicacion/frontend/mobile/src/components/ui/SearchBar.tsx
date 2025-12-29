import { Ionicons } from '@expo/vector-icons'
import * as React from 'react'
import { TextInput, View, Pressable, type TextInputProps } from 'react-native'

type Props = TextInputProps & {
    onSearch?: (text: string) => void
    onClear?: () => void
}

export function SearchBar({ onSearch, onClear, style, value, ...props }: Props) {
    return (
        <View
            className="flex-row items-center bg-white rounded-xl border border-neutral-200 px-4 h-12 shadow-sm shadow-black/5"
            style={style}
        >
            <Ionicons name="search" size={20} color="#9CA3AF" />
            <TextInput
                className="flex-1 ml-2 text-neutral-900 text-base"
                placeholderTextColor="#9CA3AF"
                value={value}
                {...props}
            />
            {value ? (
                <Pressable onPress={onClear}>
                    <Ionicons name="close-circle" size={18} color="#9CA3AF" />
                </Pressable>
            ) : null}
        </View>
    )
}

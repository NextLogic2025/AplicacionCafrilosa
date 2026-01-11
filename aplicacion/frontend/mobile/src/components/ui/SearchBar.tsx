import { Ionicons } from '@expo/vector-icons'
import React from 'react'
import { TextInput, View, Pressable, type TextInputProps, StyleProp, ViewStyle } from 'react-native'

type SearchBarProps = TextInputProps & {
    onSearch?: (text: string) => void
    onClear?: () => void
    style?: StyleProp<ViewStyle>
}

export const SearchBar: React.FC<SearchBarProps> = ({ onSearch, onClear, style, value, ...props }) => {
    return (
        <View
            className="flex-row items-center bg-white rounded-xl border border-neutral-200 px-3 shadow-sm shadow-black/5"
            style={[{ height: 52 }, style]}
        >
            <Ionicons name="search" size={20} color="#9CA3AF" />
            <TextInput
                className="flex-1 ml-2 text-neutral-900 text-base"
                placeholderTextColor="#9CA3AF"
                value={value}
                {...props}
            />
            {value && value.length > 0 ? (
                <Pressable onPress={onClear}>
                    <Ionicons name="close-circle" size={18} color="#9CA3AF" />
                </Pressable>
            ) : null}
        </View>
    )
}

import * as React from 'react'
import { ScrollView, Text, Pressable, View } from 'react-native'
import { BRAND_COLORS } from '../../shared/types'

type Category = {
    id: number | string
    name: string
}

type Props = {
    categories: Category[]
    selectedId: number | string | null
    onSelect: (id: number | string) => void
}

export function CategoryFilter({ categories, selectedId, onSelect }: Props) {
    return (
        <View>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 8 }}
            >
                {categories.map((cat, index) => {
                    const isSelected = selectedId === cat.id
                    return (
                        <Pressable
                            key={cat.id}
                            onPress={() => onSelect(cat.id)}
                            className={`px-4 py-2 rounded-full border ${isSelected ? 'bg-brand-red border-brand-red' : 'bg-white border-neutral-200'}`}
                            style={[
                                isSelected ? { elevation: 2, shadowColor: BRAND_COLORS.red, shadowOpacity: 0.3, shadowOffset: { width: 0, height: 2 } } : {},
                                index > 0 ? { marginLeft: 10 } : {}
                            ]}
                        >
                            <Text className={`text-sm font-semibold ${isSelected ? 'text-white' : 'text-neutral-600'}`}>
                                {cat.name}
                            </Text>
                        </Pressable>
                    )
                })}
            </ScrollView>
        </View>
    )
}

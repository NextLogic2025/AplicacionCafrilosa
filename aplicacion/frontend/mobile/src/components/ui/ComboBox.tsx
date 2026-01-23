import { Ionicons } from '@expo/vector-icons'
import * as React from 'react'
import { Modal, Pressable, ScrollView, Text, TouchableOpacity, View } from 'react-native'

import { BRAND_COLORS } from '../../shared/types'

export type ComboBoxOption<Value extends string | number = string> = {
  value: Value
  label: string
  description?: string
}

type Props<Value extends string | number> = {
  options: ComboBoxOption<Value>[]
  value?: Value
  onValueChange: (value: Value) => void
  label?: string
  placeholder?: string
  description?: string
}

export function ComboBox<Value extends string | number>({
  options,
  value,
  onValueChange,
  label,
  placeholder,
  description,
}: Props<Value>) {
  const [isOpen, setIsOpen] = React.useState(false)
  const selectedOption = React.useMemo(() => options.find(option => option.value === value), [options, value])

  const handleSelect = (optionValue: Value) => {
    onValueChange(optionValue)
    setIsOpen(false)
  }

  return (
    <>
      {label && (
        <Text className="text-[10px] tracking-[0.2em] uppercase text-neutral-400 mb-2">{label}</Text>
      )}

      <Pressable
        onPress={() => setIsOpen(true)}
        className="rounded-3xl bg-white px-4 py-3 flex-row items-center justify-between active:scale-95"
        style={({ pressed }) => [
          {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.08,
            shadowRadius: 15,
            elevation: 7,
            borderWidth: 1,
            borderColor: '#F4F4F5',
            transform: pressed ? [{ translateY: 1 }] : [{ translateY: 0 }],
          },
        ]}
      >
        <View className="flex-1 pr-3">
          <Text className={`text-base font-semibold ${selectedOption ? 'text-neutral-900' : 'text-neutral-400'}`} numberOfLines={1}>
            {selectedOption?.label ?? placeholder ?? 'Seleccionar categoría'}
          </Text>
          {(description || selectedOption?.description) && (
            <Text className="text-[11px] text-neutral-500 mt-1">
              {selectedOption?.description ?? description}
            </Text>
          )}
        </View>
        <Ionicons name="chevron-down-outline" size={22} color={BRAND_COLORS.red} />
      </Pressable>

      <Modal visible={isOpen} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setIsOpen(false)}>
        <TouchableOpacity className="flex-1" activeOpacity={1} onPress={() => setIsOpen(false)}>
          <View
            className="flex-1"
            style={{ backgroundColor: 'rgba(0,0,0,0.32)', justifyContent: 'flex-end' }}
          >
            <View className="bg-white rounded-t-3xl p-5 max-h-72 border border-[#EFEFEF] shadow-xl">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-sm font-bold text-neutral-900">Selecciona categoría</Text>
                <Pressable onPress={() => setIsOpen(false)} className="p-2">
                  <Ionicons name="close" size={20} color="#9CA3AF" />
                </Pressable>
              </View>
              <ScrollView showsVerticalScrollIndicator={false}>
                {options.map(option => {
                  const isSelected = option.value === value
                  return (
                    <Pressable
                      key={option.value.toString()}
                      onPress={() => handleSelect(option.value)}
                      className="py-3"
                      style={{
                        borderBottomWidth: 1,
                        borderBottomColor: '#F3F4F6',
                        backgroundColor: isSelected ? '#FEF3F2' : 'transparent',
                      }}
                    >
                      <View className="flex-row items-center justify-between">
                        <View className="flex-1 pr-3">
                          <Text className="text-sm font-semibold text-neutral-900">{option.label}</Text>
                          {option.description && (
                            <Text className="text-[11px] text-neutral-500 mt-0.5">
                              {option.description}
                            </Text>
                          )}
                        </View>
                        {isSelected && (
                          <View className="w-7 h-7 rounded-full items-center justify-center" style={{ backgroundColor: `${BRAND_COLORS.red}20` }}>
                            <Ionicons name="checkmark" size={18} color={BRAND_COLORS.red} />
                          </View>
                        )}
                      </View>
                    </Pressable>
                  )
                })}
              </ScrollView>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  )
}

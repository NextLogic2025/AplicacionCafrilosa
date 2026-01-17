import React from 'react'
import { TouchableOpacity, View } from 'react-native'
import { BRAND_COLORS } from '../../shared/types'

type Props = {
    checked: boolean
    onToggle: () => void
    disabled?: boolean
    colorOn?: string
    colorOff?: string
    size?: 'sm' | 'md'
}

export function ToggleSwitch({ checked, onToggle, disabled, colorOn = '#22c55e', colorOff = '#d1d5db', size = 'sm' }: Props) {
    const dims = size === 'sm'
        ? { w: 40, h: 24, knob: 20, padding: 2, translate: 16 }
        : { w: 50, h: 30, knob: 26, padding: 2, translate: 20 }

    return (
        <TouchableOpacity
            activeOpacity={0.8}
            onPress={onToggle}
            disabled={disabled}
            style={{
                width: dims.w,
                height: dims.h,
                borderRadius: dims.h / 2,
                backgroundColor: checked ? colorOn : colorOff,
                padding: dims.padding,
                justifyContent: 'center',
                opacity: disabled ? 0.6 : 1
            }}
        >
            <View
                style={{
                    width: dims.knob,
                    height: dims.knob,
                    borderRadius: dims.knob / 2,
                    backgroundColor: '#fff',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.2,
                    shadowRadius: 2,
                    elevation: 2,
                    transform: [{ translateX: checked ? dims.translate : 0 }]
                }}
            />
        </TouchableOpacity>
    )
}

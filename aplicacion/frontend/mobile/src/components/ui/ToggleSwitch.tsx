import React from 'react'
import { Switch } from 'react-native'

type Props = {
    checked: boolean
    onToggle: () => void
    disabled?: boolean
    colorOn?: string
    colorOff?: string
    size?: 'sm' | 'md'
}

export function ToggleSwitch({
    checked,
    onToggle,
    disabled,
    colorOn = '#22c55e',
    colorOff = '#d1d5db'
}: Props) {
    return (
        <Switch
            value={checked}
            onValueChange={onToggle}
            disabled={disabled}
            trackColor={{ false: colorOff, true: colorOn }}
            thumbColor="#ffffff"
            ios_backgroundColor={colorOff}
        />
    )
}

import * as React from 'react'
import { Text, TextInput, View } from 'react-native'

type Props = {
  label: string
  placeholder?: string
  value?: string
  onChangeText?: (v: string) => void
  onBlur?: () => void
  secureTextEntry?: boolean
  error?: string
  left?: React.ReactNode
  right?: React.ReactNode
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters'
  keyboardType?: 'default' | 'email-address'
  textContentType?: 'emailAddress' | 'password' | 'none'
}

export const TextField = React.memo(function TextField({ label, error, left, right, ...inputProps }: Props) {
  return (
    <View className="gap-2">
      <Text className="text-xs text-neutral-600">{label}</Text>
      <View
        className={[
          'flex-row items-center gap-2 rounded-2xl border px-4 py-3',
          'bg-neutral-50 border-neutral-200',
          error ? 'border-red-400/60' : '',
        ].join(' ')}
      >
        {left ? <View className="opacity-70">{left}</View> : null}
        <TextInput
          className="flex-1 text-neutral-900"
          placeholderTextColor="rgba(17,24,39,0.45)"
          {...inputProps}
          placeholder={inputProps.placeholder}
        />
        {right ? <View>{right}</View> : null}
      </View>
      {error ? <Text className="text-xs text-red-700">{error}</Text> : null}
    </View>
  )
})

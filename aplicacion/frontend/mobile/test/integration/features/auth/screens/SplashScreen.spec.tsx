import React from 'react'
import { act, render } from '@testing-library/react-native'
import { SplashScreen } from '../../../../../src/features/auth/screens/SplashScreen'

describe('integration/auth/SplashScreen', () => {
  it('calls onDone after 2 seconds', () => {
    jest.useFakeTimers()
    const onDone = jest.fn()

    render(<SplashScreen onDone={onDone} />)

    act(() => {
      jest.advanceTimersByTime(2000)
    })

    expect(onDone).toHaveBeenCalled()
    jest.useRealTimers()
  })
})


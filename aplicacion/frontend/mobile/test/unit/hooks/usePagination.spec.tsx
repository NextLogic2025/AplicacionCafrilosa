import React from 'react'
import { Text, TouchableOpacity, View } from 'react-native'
import { act, fireEvent, render, waitFor } from '@testing-library/react-native'
import { usePagination } from '../../../src/hooks/usePagination'

type Item = { id: string }

function PaginationHarness({ fetchFn }: { fetchFn: (page: number, perPage: number) => Promise<any> }) {
  const pagination = usePagination<Item>(fetchFn, { perPage: 2 })
  return (
    <View>
      <Text testID="count">{pagination.data.length}</Text>
      <Text testID="page">{pagination.page}</Text>
      <Text testID="hasMore">{String(pagination.hasMore)}</Text>
      <Text testID="error">{pagination.error ?? ''}</Text>
      <TouchableOpacity testID="refresh" onPress={() => pagination.refresh()} />
      <TouchableOpacity testID="loadMore" onPress={() => pagination.loadMore()} />
      <TouchableOpacity testID="reset" onPress={() => pagination.reset()} />
    </View>
  )
}

describe('hooks/usePagination', () => {
  it('refresh then loadMore appends and updates hasMore', async () => {
    const fetchFn = jest.fn(async (page: number) => {
      if (page === 1) {
        return {
          items: [{ id: 'i1' }, { id: 'i2' }],
          metadata: { total_items: 3, page: 1, per_page: 2, total_pages: 2 },
        }
      }
      return {
        items: [{ id: 'i3' }],
        metadata: { total_items: 3, page: 2, per_page: 2, total_pages: 2 },
      }
    })

    const screen = render(<PaginationHarness fetchFn={fetchFn} />)

    await act(async () => {
      fireEvent.press(screen.getByTestId('refresh'))
    })

    await waitFor(() => {
      expect(screen.getByTestId('count').props.children).toBe(2)
      expect(screen.getByTestId('hasMore').props.children).toBe('true')
    })

    await act(async () => {
      fireEvent.press(screen.getByTestId('loadMore'))
    })

    await waitFor(() => {
      expect(screen.getByTestId('count').props.children).toBe(3)
      expect(screen.getByTestId('hasMore').props.children).toBe('false')
    })

    expect(fetchFn).toHaveBeenCalledTimes(2)
  })

  it('sets error on fetch failure', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    const fetchFn = jest.fn(async () => {
      throw new Error('boom')
    })
    const screen = render(<PaginationHarness fetchFn={fetchFn} />)

    await act(async () => {
      fireEvent.press(screen.getByTestId('refresh'))
    })

    await waitFor(() => {
      expect(String(screen.getByTestId('error').props.children)).toMatch(/Error al cargar datos/i)
    })
    errorSpy.mockRestore()
  })
})

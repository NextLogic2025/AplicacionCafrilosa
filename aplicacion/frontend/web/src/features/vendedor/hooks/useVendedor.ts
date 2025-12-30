import { useState, useCallback } from 'react'

export type VendedorState = {
  loading: boolean
  error?: string
}

export function useVendedor() {
  const [state, setState] = useState<VendedorState>({ loading: false })

  const withLoading = useCallback(async <T>(task: () => Promise<T>): Promise<T> => {
    setState({ loading: true })
    try {
      const result = await task()
      setState({ loading: false })
      return result
    } catch (error) {
      setState({ loading: false, error: error instanceof Error ? error.message : 'Error desconocido' })
      throw error
    }
  }, [])

  return {
    state,
    withLoading,
  }
}

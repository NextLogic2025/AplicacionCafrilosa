import { useEffect, useRef, useCallback } from 'react'
import { AppState, AppStateStatus } from 'react-native'

type UseRealtimeSyncOptions = {
    /** Intervalo de polling en ms (default: 5000 = 5 segundos) */
    interval?: number
    /** Si debe estar activo (default: true) */
    enabled?: boolean
    /** Solo hacer polling cuando la app está en primer plano (default: true) */
    onlyWhenActive?: boolean
}

/**
 * Hook para sincronización en tiempo real usando polling
 * Útil para mantener datos actualizados entre diferentes dispositivos/vistas
 *
 * @example
 * ```tsx
 * const { refresh } = useRealtimeSync(loadData, {
 *   interval: 5000, // 5 segundos
 *   enabled: true
 * })
 * ```
 */
export function useRealtimeSync(
    fetchFn: () => Promise<void> | void,
    options: UseRealtimeSyncOptions = {}
) {
    const {
        interval = 5000,
        enabled = true,
        onlyWhenActive = true,
    } = options

    const intervalRef = useRef<NodeJS.Timeout | null>(null)
    const appStateRef = useRef<AppStateStatus>(AppState.currentState)
    const fetchFnRef = useRef(fetchFn)

    // Mantener referencia actualizada de fetchFn
    useEffect(() => {
        fetchFnRef.current = fetchFn
    }, [fetchFn])

    const startPolling = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current)
        }

        intervalRef.current = setInterval(() => {
            if (onlyWhenActive && appStateRef.current !== 'active') {
                return
            }
            fetchFnRef.current()
        }, interval)
    }, [interval, onlyWhenActive])

    const stopPolling = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current)
            intervalRef.current = null
        }
    }, [])

    const refresh = useCallback(async () => {
        await fetchFnRef.current()
    }, [])

    // Manejar cambios de estado de la app
    useEffect(() => {
        const handleAppStateChange = (nextAppState: AppStateStatus) => {
            if (onlyWhenActive) {
                if (appStateRef.current !== 'active' && nextAppState === 'active') {
                    // App volvió al primer plano, refrescar inmediatamente
                    fetchFnRef.current()
                    if (enabled) {
                        startPolling()
                    }
                } else if (appStateRef.current === 'active' && nextAppState !== 'active') {
                    // App fue a segundo plano, pausar polling
                    stopPolling()
                }
            }
            appStateRef.current = nextAppState
        }

    const subscription = AppState.addEventListener('change', handleAppStateChange)

        return () => {
            subscription.remove()
        }
    }, [enabled, onlyWhenActive, startPolling, stopPolling])

    // Limpiar polling en el desmontaje para evitar leaks
    useEffect(() => {
        return () => {
            stopPolling()
        }
    }, [stopPolling])

    // Iniciar/detener polling cuando enabled cambia
    useEffect(() => {
        if (enabled) {
            startPolling()
        } else {
            stopPolling()
        }

        return () => {
            stopPolling()
        }
    }, [enabled, startPolling, stopPolling])

    return {
        refresh,
        startPolling,
        stopPolling,
    }
}

/**
 * Hook simplificado para polling con intervalo configurable
 * Se usa principalmente para listas que necesitan actualizarse automáticamente
 */
export function usePolling(
    fetchFn: () => Promise<void> | void,
    intervalMs: number = 5000,
    enabled: boolean = true
) {
    return useRealtimeSync(fetchFn, {
        interval: intervalMs,
        enabled,
        onlyWhenActive: true,
    })
}

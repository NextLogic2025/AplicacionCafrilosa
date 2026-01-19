import { useRef, useEffect, useState } from 'react'
import { AppState, AppStateStatus } from 'react-native'
import { useSafeAreaInsets, EdgeInsets } from 'react-native-safe-area-context'

/**
 * Hook que proporciona insets estables que no cambian al volver del background.
 *
 * Problema: Cuando la app vuelve del background, useSafeAreaInsets() puede retornar
 * valores temporalmente incorrectos (0 o diferentes), causando que la UI "salte".
 *
 * Solución: Este hook cachea los valores válidos y los mantiene estables durante
 * las transiciones de estado de la app.
 */
export function useStableInsets(): EdgeInsets {
    const insets = useSafeAreaInsets()
    const [stableInsets, setStableInsets] = useState<EdgeInsets>(insets)
    const lastValidInsets = useRef<EdgeInsets>(insets)
    const appState = useRef<AppStateStatus>(AppState.currentState)
    const isTransitioning = useRef(false)

    // Verificar si los insets son válidos (no todos cero cuando esperamos valores)
    const areInsetsValid = (newInsets: EdgeInsets): boolean => {
        // Si ya teníamos insets válidos y ahora son todos 0, es sospechoso
        const hadValidInsets = lastValidInsets.current.top > 0 || lastValidInsets.current.bottom > 0
        const allZero = newInsets.top === 0 && newInsets.bottom === 0 &&
                       newInsets.left === 0 && newInsets.right === 0

        // Si estamos en transición y los nuevos insets son todos 0, rechazarlos
        if (isTransitioning.current && hadValidInsets && allZero) {
            return false
        }

        return true
    }

    // Escuchar cambios de estado de la app
    useEffect(() => {
        const handleAppStateChange = (nextAppState: AppStateStatus) => {
            if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
                // La app está volviendo del background
                isTransitioning.current = true

                // Después de un breve delay, permitir actualizaciones de insets
                setTimeout(() => {
                    isTransitioning.current = false
                }, 500) // 500ms es suficiente para que los insets se estabilicen
            }
            appState.current = nextAppState
        }

        const subscription = AppState.addEventListener('change', handleAppStateChange)
        return () => subscription.remove()
    }, [])

    // Actualizar insets estables cuando los insets reales cambien
    useEffect(() => {
        if (areInsetsValid(insets)) {
            // Solo actualizar si los valores son significativamente diferentes
            const isDifferent =
                Math.abs(insets.top - lastValidInsets.current.top) > 1 ||
                Math.abs(insets.bottom - lastValidInsets.current.bottom) > 1 ||
                Math.abs(insets.left - lastValidInsets.current.left) > 1 ||
                Math.abs(insets.right - lastValidInsets.current.right) > 1

            // Primera vez o cambio significativo válido
            if (lastValidInsets.current.top === 0 && lastValidInsets.current.bottom === 0 &&
                (insets.top > 0 || insets.bottom > 0)) {
                // Primera inicialización con valores válidos
                lastValidInsets.current = insets
                setStableInsets(insets)
            } else if (isDifferent && !isTransitioning.current) {
                // Cambio válido fuera de transición (ej: rotación de pantalla)
                lastValidInsets.current = insets
                setStableInsets(insets)
            }
        }
    }, [insets])

    return stableInsets
}

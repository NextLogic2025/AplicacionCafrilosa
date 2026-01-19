/**
 * Utilidades para manejo de errores en la aplicación
 */

import { isApiError } from '../services/api/ApiError'

export interface ErrorHandler {
    title: string
    message: string
    type: 'error' | 'warning' | 'info'
}

/**
 * Maneja errores de forma elegante y devuelve información para mostrar al usuario
 */
export function handleApiError(error: unknown): ErrorHandler {
    if (isApiError(error)) {
        if (error.status === 401) {
            return {
                type: 'warning',
                title: 'Sesión Expirada',
                message: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.'
            }
        }
        if (error.status === 0) {
            return {
                type: 'error',
                title: 'Error de Conexión',
                message: 'No se pudo conectar con el servidor. Verifica tu conexión a internet.'
            }
        }
        if (error.status === 404) {
            return { type: 'error', title: 'No Encontrado', message: 'El recurso solicitado no existe.' }
        }
        if (error.status === 403) {
            return { type: 'error', title: 'Acceso Denegado', message: 'No tienes permisos para realizar esta acción.' }
        }
        if (error.status >= 500) {
            return {
                type: 'error',
                title: 'Error del Servidor',
                message: 'Ocurrió un error en el servidor. Por favor, intenta más tarde.'
            }
        }
    }

    // Sesión expirada
    if ((error as { message?: unknown } | null)?.message === 'SESSION_EXPIRED') {
        return {
            type: 'warning',
            title: 'Sesión Expirada',
            message: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.'
        }
    }

    // Error de red
    const message = typeof (error as { message?: unknown } | null)?.message === 'string' ? (error as { message: string }).message : ''
    if (message.includes('Network request failed') || message.includes('fetch')) {
        return {
            type: 'error',
            title: 'Error de Conexión',
            message: 'No se pudo conectar con el servidor. Verifica tu conexión a internet.'
        }
    }

    // Error 404
    if (message.includes('404')) {
        return {
            type: 'error',
            title: 'No Encontrado',
            message: 'El recurso solicitado no existe.'
        }
    }

    // Error 403
    if (message.includes('403')) {
        return {
            type: 'error',
            title: 'Acceso Denegado',
            message: 'No tienes permisos para realizar esta acción.'
        }
    }

    // Error 500
    if (message.includes('500')) {
        return {
            type: 'error',
            title: 'Error del Servidor',
            message: 'Ocurrió un error en el servidor. Por favor, intenta más tarde.'
        }
    }

    // Error genérico
    return {
        type: 'error',
        title: 'Error',
        message: message || 'Ocurrió un error inesperado. Por favor, intenta nuevamente.'
    }
}

/**
 * Verifica si un error es de sesión expirada
 */
export function isSessionExpiredError(error: unknown): boolean {
    return (error as { message?: unknown } | null)?.message === 'SESSION_EXPIRED'
}

/**
 * Extrae un mensaje de error legible de cualquier tipo de error
 */
export function getErrorMessage(error: unknown): string {
    if (typeof error === 'string') return error
    if (typeof (error as { message?: unknown } | null)?.message === 'string') return (error as { message: string }).message
    if (typeof (error as { error?: unknown } | null)?.error === 'string') return (error as { error: string }).error
    return 'Error desconocido'
}

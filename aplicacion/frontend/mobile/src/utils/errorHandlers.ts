/**
 * Utilidades para manejo de errores en la aplicación
 */

export interface ErrorHandler {
    title: string
    message: string
    type: 'error' | 'warning' | 'info'
}

/**
 * Maneja errores de forma elegante y devuelve información para mostrar al usuario
 */
export function handleApiError(error: any): ErrorHandler {
    // Sesión expirada
    if (error?.message === 'SESSION_EXPIRED') {
        return {
            type: 'warning',
            title: 'Sesión Expirada',
            message: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.'
        }
    }

    // Error de red
    if (error?.message?.includes('Network request failed') || error?.message?.includes('fetch')) {
        return {
            type: 'error',
            title: 'Error de Conexión',
            message: 'No se pudo conectar con el servidor. Verifica tu conexión a internet.'
        }
    }

    // Error 404
    if (error?.message?.includes('404')) {
        return {
            type: 'error',
            title: 'No Encontrado',
            message: 'El recurso solicitado no existe.'
        }
    }

    // Error 403
    if (error?.message?.includes('403')) {
        return {
            type: 'error',
            title: 'Acceso Denegado',
            message: 'No tienes permisos para realizar esta acción.'
        }
    }

    // Error 500
    if (error?.message?.includes('500')) {
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
        message: error?.message || 'Ocurrió un error inesperado. Por favor, intenta nuevamente.'
    }
}

/**
 * Verifica si un error es de sesión expirada
 */
export function isSessionExpiredError(error: any): boolean {
    return error?.message === 'SESSION_EXPIRED'
}

/**
 * Extrae un mensaje de error legible de cualquier tipo de error
 */
export function getErrorMessage(error: any): string {
    if (typeof error === 'string') return error
    if (error?.message) return error.message
    if (error?.error) return error.error
    return 'Error desconocido'
}

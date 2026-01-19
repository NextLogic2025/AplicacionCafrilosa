import { isApiError } from '../services/api/ApiError'

/**
 * Mensajes de error amigables para el usuario final.
 * Oculta detalles técnicos y muestra mensajes comprensibles.
 */

export const ERROR_MESSAGES = {
    // Errores de red y conexión
    NETWORK_ERROR: 'No se pudo conectar con el servidor. Verifica tu conexión a internet.',
    TIMEOUT_ERROR: 'La solicitud tardó demasiado. Intenta de nuevo.',
    SERVER_UNAVAILABLE: 'El servicio no está disponible en este momento. Intenta más tarde.',

    // Errores de autenticación
    INVALID_CREDENTIALS: 'Correo o contraseña incorrectos.',
    SESSION_EXPIRED: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
    UNAUTHORIZED: 'No tienes autorización para realizar esta acción.',
    ACCOUNT_DISABLED: 'Tu cuenta ha sido desactivada. Contacta al administrador.',

    // Errores de permisos
    FORBIDDEN: 'No tienes permisos para acceder a este recurso.',
    ACCESS_DENIED: 'Acceso denegado.',

    // Errores de recursos
    NOT_FOUND: 'El recurso solicitado no fue encontrado.',
    RESOURCE_DELETED: 'Este elemento ya no está disponible.',

    // Errores de validación
    VALIDATION_ERROR: 'Los datos ingresados no son válidos. Revisa el formulario.',
    DUPLICATE_ENTRY: 'Este registro ya existe en el sistema.',

    // Errores de operaciones
    CREATE_ERROR: 'No se pudo crear el registro. Intenta de nuevo.',
    UPDATE_ERROR: 'No se pudo actualizar la información. Intenta de nuevo.',
    DELETE_ERROR: 'No se pudo eliminar el registro. Intenta de nuevo.',
    LOAD_ERROR: 'No se pudo cargar la información. Intenta de nuevo.',

    // Errores específicos de dominio
    ORDER_ERROR: 'No se pudo procesar el pedido. Intenta de nuevo.',
    CART_ERROR: 'No se pudo actualizar el carrito. Intenta de nuevo.',
    PRODUCT_ERROR: 'No se pudo obtener la información del producto.',
    CLIENT_ERROR: 'No se pudo obtener la información del cliente.',
    USER_ERROR: 'No se pudo obtener la información del usuario.',
    PROFILE_ERROR: 'No se pudo cargar tu perfil.',
    PASSWORD_RESET_ERROR: 'No se pudo enviar el correo de recuperación. Verifica tu correo e intenta de nuevo.',

    // Error genérico
    GENERIC_ERROR: 'Ocurrió un error inesperado. Intenta de nuevo.',
} as const

type ErrorMessageKey = keyof typeof ERROR_MESSAGES

/**
 * Mapeo de códigos HTTP a mensajes amigables
 */
const HTTP_STATUS_MESSAGES: Record<number, string> = {
    0: ERROR_MESSAGES.NETWORK_ERROR,
    400: ERROR_MESSAGES.VALIDATION_ERROR,
    401: ERROR_MESSAGES.SESSION_EXPIRED,
    403: ERROR_MESSAGES.FORBIDDEN,
    404: ERROR_MESSAGES.NOT_FOUND,
    408: ERROR_MESSAGES.TIMEOUT_ERROR,
    409: ERROR_MESSAGES.DUPLICATE_ENTRY,
    422: ERROR_MESSAGES.VALIDATION_ERROR,
    500: ERROR_MESSAGES.SERVER_UNAVAILABLE,
    502: ERROR_MESSAGES.SERVER_UNAVAILABLE,
    503: ERROR_MESSAGES.SERVER_UNAVAILABLE,
    504: ERROR_MESSAGES.TIMEOUT_ERROR,
}

/**
 * Patrones de mensajes de error del backend que deben ser traducidos
 */
const BACKEND_MESSAGE_PATTERNS: Array<{ pattern: RegExp | string; message: string }> = [
    // Errores de autenticación
    { pattern: /credenciales? (inválid|incorrect)/i, message: ERROR_MESSAGES.INVALID_CREDENTIALS },
    { pattern: /usuario desactivado/i, message: ERROR_MESSAGES.ACCOUNT_DISABLED },
    { pattern: /token (inválido|expirado|ilegible)/i, message: ERROR_MESSAGES.SESSION_EXPIRED },
    { pattern: /refresh token/i, message: ERROR_MESSAGES.SESSION_EXPIRED },
    { pattern: 'SESSION_EXPIRED', message: ERROR_MESSAGES.SESSION_EXPIRED },
    { pattern: /unauthorized|no autorizado/i, message: ERROR_MESSAGES.UNAUTHORIZED },
    { pattern: /forbidden|prohibido/i, message: ERROR_MESSAGES.FORBIDDEN },

    // Errores de duplicados - mensajes específicos
    { pattern: /email ya registrado/i, message: 'Este correo electrónico ya está registrado.' },
    { pattern: /duplicate.*codigo_ref|codigo_ref.*duplicate|ya existe.*codigo/i, message: 'Ya existe un registro con ese código de referencia.' },
    { pattern: /duplicate.*codigo_visual|codigo_visual.*duplicate/i, message: 'Ya existe una ubicación con ese código visual.' },
    { pattern: /duplicate.*nombre|nombre.*duplicate/i, message: 'Ya existe un registro con ese nombre.' },
    { pattern: /ya existe.*almac/i, message: 'Ya existe un almacén con esos datos.' },
    { pattern: /ya existe.*ubicacion/i, message: 'Ya existe una ubicación con esos datos.' },
    { pattern: /ya existe.*lote/i, message: 'Ya existe un lote con ese número.' },
    { pattern: /unique.*constraint|constraint.*unique|duplicate.*key|key.*duplicate/i, message: ERROR_MESSAGES.DUPLICATE_ENTRY },

    // Errores de stock y bodega
    { pattern: /no hay.*stock|stock.*insuficiente|insufficient.*stock/i, message: 'No hay stock suficiente para completar la operación.' },
    { pattern: /lote.*no.*encontrado|no.*encontrado.*lote/i, message: 'El lote especificado no fue encontrado.' },
    { pattern: /ubicacion.*no.*encontrada|no.*encontrada.*ubicacion/i, message: 'La ubicación especificada no fue encontrada.' },
    { pattern: /picking.*no.*encontrad/i, message: 'La orden de picking no fue encontrada.' },
    { pattern: /reserva.*no.*encontrad/i, message: 'La reserva no fue encontrada.' },
    { pattern: /ya.*asignado|already.*assigned/i, message: 'Este picking ya está asignado a otro bodeguero.' },
    { pattern: /ya.*en.*proceso|already.*in.*progress/i, message: 'Este picking ya está siendo procesado.' },

    // Errores de red
    { pattern: /network|red|conexión/i, message: ERROR_MESSAGES.NETWORK_ERROR },
    { pattern: /timeout|tiempo agotado/i, message: ERROR_MESSAGES.TIMEOUT_ERROR },
    { pattern: /not found|no encontrado/i, message: ERROR_MESSAGES.NOT_FOUND },
]

/**
 * Obtiene un mensaje de error amigable para el usuario.
 *
 * @param error - El error capturado
 * @param context - Contexto opcional para mensajes más específicos
 * @returns Mensaje amigable para mostrar al usuario
 */
export function getUserFriendlyMessage(
    error: unknown,
    context?: ErrorMessageKey
): string {
    // Si hay un contexto específico y es un error sin mensaje claro, usar el contexto
    const contextMessage = context ? ERROR_MESSAGES[context] : undefined

    // Manejar ApiError con código de estado
    if (isApiError(error)) {
        // Primero intentar traducir el mensaje del backend
        const translatedMessage = translateBackendMessage(error.message)
        if (translatedMessage !== error.message) {
            return translatedMessage
        }

        // Luego usar el código HTTP
        const httpMessage = HTTP_STATUS_MESSAGES[error.status]
        if (httpMessage) {
            return httpMessage
        }

        return contextMessage || ERROR_MESSAGES.GENERIC_ERROR
    }

    // Manejar Error estándar
    if (error instanceof Error) {
        // Caso especial: error de sesión expirada
        if (error.message === 'SESSION_EXPIRED') {
            return ERROR_MESSAGES.SESSION_EXPIRED
        }

        // Intentar traducir el mensaje
        const translatedMessage = translateBackendMessage(error.message)
        if (translatedMessage !== error.message) {
            return translatedMessage
        }

        // Si el mensaje ya es amigable (no contiene términos técnicos), usarlo
        if (isUserFriendlyMessage(error.message)) {
            return error.message
        }
    }

    // Usar mensaje de contexto o genérico
    return contextMessage || ERROR_MESSAGES.GENERIC_ERROR
}

/**
 * Traduce mensajes técnicos del backend a mensajes amigables
 */
function translateBackendMessage(message: string): string {
    for (const { pattern, message: friendlyMessage } of BACKEND_MESSAGE_PATTERNS) {
        if (typeof pattern === 'string') {
            if (message === pattern) return friendlyMessage
        } else if (pattern.test(message)) {
            return friendlyMessage
        }
    }
    return message
}

/**
 * Verifica si un mensaje ya es amigable para el usuario
 * (no contiene términos técnicos comunes)
 */
function isUserFriendlyMessage(message: string): boolean {
    const technicalPatterns = [
        /api error/i,
        /status \d{3}/i,
        /http/i,
        /\d{3}:/,
        /network request failed/i,
        /fetch|axios/i,
        /json|parse/i,
        /null|undefined/i,
        /exception|stack|trace/i,
        /cannot read|cannot access/i,
        /type ?error/i,
        /reference ?error/i,
    ]

    return !technicalPatterns.some(pattern => pattern.test(message))
}

/**
 * Registra el error en consola para debugging (solo en desarrollo)
 * sin exponer detalles al usuario
 */
export function logErrorForDebugging(
    error: unknown,
    context: string,
    additionalInfo?: Record<string, unknown>
): void {
    if (__DEV__) {
        console.error(`[${context}] Error:`, {
            error,
            ...(additionalInfo && { info: additionalInfo }),
        })
    }
}

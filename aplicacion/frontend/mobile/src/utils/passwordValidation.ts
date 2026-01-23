/**
 * Validación de contraseña segura según requisitos del backend
 */

export interface PasswordValidationResult {
    isValid: boolean
    errors: string[]
}

export function validatePassword(password: string): PasswordValidationResult {
    const errors: string[] = []

    // Mínimo 8 caracteres
    if (password.length < 8) {
        errors.push('• Debe tener al menos 8 caracteres')
    }

    // Al menos una mayúscula
    if (!/[A-Z]/.test(password)) {
        errors.push('• Debe incluir al menos una letra mayúscula (A-Z)')
    }

    // Al menos una minúscula
    if (!/[a-z]/.test(password)) {
        errors.push('• Debe incluir al menos una letra minúscula (a-z)')
    }

    // Al menos un número
    if (!/[0-9]/.test(password)) {
        errors.push('• Debe incluir al menos un número (0-9)')
    }

    // Al menos un carácter especial
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        errors.push('• Debe incluir al menos un carácter especial (!@#$%&*)')
    }

    return {
        isValid: errors.length === 0,
        errors
    }
}

export function getPasswordStrengthMessage(password: string): string {
    const result = validatePassword(password)

    if (result.isValid) {
        return '✓ Contraseña segura'
    }

    return `Contraseña débil. Requisitos faltantes:\n${result.errors.join('\n')}`
}

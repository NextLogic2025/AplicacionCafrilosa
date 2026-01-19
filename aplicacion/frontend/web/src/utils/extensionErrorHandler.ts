/**
 * Extension Communication Suppressor
 *
 * Suppresses the common "Receiving end does not exist" error from Chrome extensions
 * trying to communicate with the web app when they're not installed.
 *
 * This is a safe operation and doesn't affect functionality.
 */

// Suppress Chrome extension connection errors
if (typeof window !== 'undefined' && typeof chrome !== 'undefined') {
    const originalError = console.error

    console.error = function (...args: any[]) {
        // Check if this is the common extension communication error
        const errorMsg = args[0]?.toString?.() || ''

        if (
            errorMsg.includes('Receiving end does not exist') ||
            errorMsg.includes('Could not establish connection')
        ) {
            // Silently ignore this error - it's safe and expected
            return
        }

        // Call original error handler for other errors
        originalError.apply(console, args)
    }
}

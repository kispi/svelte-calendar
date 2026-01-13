/**
 * Creates a debounced function that delays invoking the callback until after
 * the specified delay has elapsed since the last time it was invoked.
 *
 * @param callback - The function to debounce
 * @param delay - The delay in milliseconds
 * @returns An object with the debounced function and a cleanup method
 *
 * @example
 * ```ts
 * const { debounced, cleanup } = createDebounce(() => {
 *   console.log('Called after 300ms')
 * }, 300)
 *
 * debounced() // Will only execute after 300ms of no further calls
 * debounced() // Resets the timer
 *
 * // Clean up when done (e.g., in onDestroy)
 * cleanup()
 * ```
 */
export function createDebounce<T extends (...args: any[]) => any>(
    callback: T,
    delay: number
) {
    let timeout: ReturnType<typeof setTimeout> | undefined

    const debounced = ((...args: Parameters<T>) => {
        clearTimeout(timeout)
        timeout = setTimeout(() => {
            callback(...args)
        }, delay)
    }) as T

    const cleanup = () => {
        clearTimeout(timeout)
    }

    return { debounced, cleanup }
}

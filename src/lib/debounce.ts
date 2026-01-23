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
export const createDebounce = <T extends (...args: any[]) => void>(
  fn: T,
  delay: number
) => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  const debounced = (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    timeoutId = setTimeout(() => {
      fn(...args)
      timeoutId = null
    }, delay)
  }

  const cleanup = () => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
  }

  return { debounced, cleanup }
}

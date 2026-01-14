import type { Action } from 'svelte/action'
import flatpickr from 'flatpickr'
import 'flatpickr/dist/flatpickr.css'
import type { Options } from 'flatpickr/dist/types/options'

export const flatpicker: Action<HTMLInputElement, Options> = (
  node,
  options
) => {
  const minTime = options.minTime || undefined
  const defaultDate = options.defaultDate || undefined

  const fp = flatpickr(node, {
    enableTime: true,
    dateFormat: 'Y-m-d H:i',
    time_24hr: true,
    minuteIncrement: 15,
    defaultDate: defaultDate,
    minTime: minTime,
    ...options,
    onChange: (selectedDates, dateStr, instance) => {
      // Dispatch input event for Svelte binding
      node.value = dateStr
      node.dispatchEvent(new Event('input'))
    }
  })

  return {
    update(newOptions) {
      if (newOptions.defaultDate) {
        fp.setDate(newOptions.defaultDate, false)
      }
      fp.set(newOptions)
    },
    destroy() {
      fp.destroy()
    }
  }
}

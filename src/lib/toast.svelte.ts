type ToastType = 'success' | 'info' | 'error' | 'warning'
type ToastPosition = 'top' | 'bottom'

type ToastOptions = {
  type?: ToastType
  position?: ToastPosition
  duration?: number
}

type ToastItem = {
  id: string
  text: string
  type: ToastType
  position: ToastPosition
  duration: number
}

class ToastState {
  items = $state<ToastItem[]>([])

  show(text: string, options: ToastOptions = {}) {
    const id = Math.random().toString(36).substring(2, 9)
    const { type = 'info', position = 'top', duration = 3000 } = options

    const item: ToastItem = { id, text, type, position, duration }
    this.items.push(item)

    if (duration > 0) {
      setTimeout(() => {
        this.dismiss(id)
      }, duration)
    }

    return id
  }

  dismiss(id: string) {
    this.items = this.items.filter((item) => item.id !== id)
  }

  success(text: string, options: Omit<ToastOptions, 'type'> = {}) {
    return this.show(text, { ...options, type: 'success' })
  }

  error(text: string, options: Omit<ToastOptions, 'type'> = {}) {
    return this.show(text, { ...options, type: 'error' })
  }

  info(text: string, options: Omit<ToastOptions, 'type'> = {}) {
    return this.show(text, { ...options, type: 'info' })
  }

  warning(text: string, options: Omit<ToastOptions, 'type'> = {}) {
    return this.show(text, { ...options, type: 'warning' })
  }
}

export const toast = new ToastState()

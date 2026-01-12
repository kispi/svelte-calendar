/**
 * @typedef {Object} ToastItem
 * @property {string} id
 * @property {string} text
 * @property {'success' | 'info' | 'error' | 'warning'} type
 * @property {'top' | 'bottom'} position
 * @property {number} duration
 */

class ToastState {
    /** @type {ToastItem[]} */
    items = $state([])

    /**
     * @param {string} text
     * @param {Object} [options]
     * @param {'success' | 'info' | 'error' | 'warning'} [options.type]
     * @param {'top' | 'bottom'} [options.position]
     * @param {number} [options.duration]
     */
    show(text, options = {}) {
        const id = Math.random().toString(36).substring(2, 9)
        const { type = 'info', position = 'top', duration = 3000 } = options

        const item = { id, text, type, position, duration }
        this.items.push(item)

        if (duration > 0) {
            setTimeout(() => {
                this.dismiss(id)
            }, duration)
        }

        return id
    }

    /**
     * @param {string} id
     */
    dismiss(id) {
        this.items = this.items.filter((item) => item.id !== id)
    }

    /** @param {string} text @param {any} [options] */
    success(text, options = {}) {
        return this.show(text, { ...options, type: 'success' })
    }

    /** @param {string} text @param {any} [options] */
    error(text, options = {}) {
        return this.show(text, { ...options, type: 'error' })
    }

    /** @param {string} text @param {any} [options] */
    info(text, options = {}) {
        return this.show(text, { ...options, type: 'info' })
    }

    /** @param {string} text @param {any} [options] */
    warning(text, options = {}) {
        return this.show(text, { ...options, type: 'warning' })
    }
}

export const toast = new ToastState()

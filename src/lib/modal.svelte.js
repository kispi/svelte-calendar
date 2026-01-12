/**
 * @typedef {Object} ModalInstance
 * @property {string} id
 * @property {any} component
 * @property {any} props
 * @property {any} options
 * @property {(value: any) => void} resolve
 */

class ModalState {
  /** @type {ModalInstance[]} */
  stack = $state([])

  /**
   * @param {any} component
   * @param {any} props
   * @param {Object} [options]
   * @param {boolean} [options.preventCloseOnClickBackdrop]
   * @returns {Promise<any>}
   */
  show(component, props = {}, options = {}) {
    return new Promise((resolve) => {
      const id = Math.random().toString(36).substring(2, 9)
      const defaultOptions = { preventCloseOnClickBackdrop: false }
      const mergedOptions = { ...defaultOptions, ...options }

      this.stack.push({
        id,
        component,
        props,
        options: mergedOptions,
        resolve: (value) => {
          this.close(id)
          resolve(value)
        }
      })
    })
  }

  /** @param {string} id */
  close(id) {
    this.stack = this.stack.filter((m) => m.id !== id)
  }
}

export const modal = new ModalState()

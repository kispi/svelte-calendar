/**
 * @typedef {Object} ModalInstance
 * @property {string} id
 * @property {any} component
 * @property {any} props
 * @property {(value: any) => void} resolve
 */

class ModalState {
  /** @type {ModalInstance[]} */
  stack = $state([])

  /**
   * @param {any} component
   * @param {any} props
   * @returns {Promise<any>}
   */
  show(component, props = {}) {
    return new Promise((resolve) => {
      const id = Math.random().toString(36).substring(2, 9)
      this.stack.push({
        id,
        component,
        props,
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

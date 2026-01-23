import type { Component } from 'svelte'

type ModalInstance = {
  id: string
  component: Component<any>
  props: Record<string, any>
  options: {
    preventCloseOnClickBackdrop: boolean
    wrapperClass?: string
  }
  resolve: (value: any) => void
}

class ModalState {
  stack = $state<ModalInstance[]>([])

  show<T = any>(
    component: Component<any>,
    props: Record<string, any> = {},
    options: {
      preventCloseOnClickBackdrop?: boolean
      wrapperClass?: string
    } = {}
  ): Promise<T> {
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

  close(id: string) {
    this.stack = this.stack.filter((m) => m.id !== id)
  }
}

export const modal = new ModalState()

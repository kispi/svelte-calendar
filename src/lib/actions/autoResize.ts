import type { Action } from 'svelte/action'

/**
 * Svelte action to auto-resize a textarea based on its content.
 */
export const autoResize: Action<HTMLTextAreaElement> = (node) => {
  const resize = () => {
    node.style.height = 'auto'
    node.style.height = `${node.scrollHeight}px`
  }

  node.addEventListener('input', resize)

  // Initial resize to fit existing content
  // Use setTimeout to ensure the DOM has settled (e.g., inside a modal)
  setTimeout(resize, 0)

  return {
    destroy() {
      node.removeEventListener('input', resize)
    }
  }
}

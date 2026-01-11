<script>
  /**
   * @typedef {Object} ConfirmProps
   * @property {string} [title]
   * @property {string} [message]
   * @property {string} [confirmText]
   * @property {string} [cancelText]
   * @property {string} [confirmClass]
   * @property {(value?: any) => void} [close]
   */

  /** @type {ConfirmProps} */
  let {
    title = 'Confirm Action',
    message = 'Are you sure you want to proceed?',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    confirmClass = 'bg-red-600 hover:bg-red-700 text-white',
    close = () => {}
  } = $props()
</script>

<div class="p-6">
  <h3 class="text-lg font-bold text-slate-900 mb-2">{title}</h3>
  <p class="text-slate-500 mb-6">{message}</p>

  <div class="flex justify-end gap-3">
    <button
      type="button"
      onclick={() => close(false)}
      class="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded border border-slate-200 transition-colors"
    >
      {cancelText}
    </button>
    <button
      type="button"
      onclick={() => close(true)}
      class="px-4 py-2 text-sm font-bold rounded shadow-sm transition-all transform active:scale-95 {confirmClass}"
    >
      {confirmText}
    </button>
  </div>
</div>

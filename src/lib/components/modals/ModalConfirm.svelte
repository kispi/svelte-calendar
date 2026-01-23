<script lang="ts">
  import { i18n } from '$lib/i18n.svelte.js'

  interface ConfirmProps {
    title?: string
    message?: string
    confirmText?: string
    cancelText?: string
    confirmClass?: string
    close?: (value?: boolean) => void
  }

  let {
    title = i18n.t('common.confirm'),
    message = i18n.t('event.deleteConfirm'),
    confirmText = i18n.t('common.confirm'),
    cancelText = i18n.t('common.cancel'),
    confirmClass = 'bg-red-600 hover:bg-red-700 text-white',
    close = () => {}
  }: ConfirmProps = $props()
</script>

<div class="p-6">
  <h3 class="text-lg font-bold text-slate-900 mb-2">{title}</h3>
  <p class="text-slate-500 mb-6">{message}</p>

  <div class="flex justify-end gap-3">
    <button type="button" onclick={() => close(false)} class="btn-default">
      {cancelText}
    </button>
    <button
      type="button"
      onclick={() => close(true)}
      class="btn-base shadow-lg transition-all transform active:scale-95 {confirmClass}"
    >
      {confirmText}
    </button>
  </div>
</div>

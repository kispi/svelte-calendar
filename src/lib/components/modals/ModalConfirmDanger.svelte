<script lang="ts">
  import { i18n } from '$lib/i18n.svelte.js'

  interface DangerConfirmProps {
    title?: string
    message?: string
    confirmText?: string // The phrase to type
    actionText?: string // The button label
    cancelText?: string
    close?: (value?: boolean) => void
  }

  let {
    title = i18n.t('common.delete'),
    message = 'Are you sure?',
    confirmText = 'DELETE',
    actionText = i18n.t('common.delete'),
    cancelText = i18n.t('common.cancel'),
    close = () => {}
  }: DangerConfirmProps = $props()

  let input = $state('')
  let isMatch = $derived(input === confirmText)

  const handleKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && isMatch) {
      close(true)
    } else if (e.key === 'Escape') {
      close(false)
    }
  }
</script>

<div class="p-6">
  <h3 class="text-lg font-bold text-slate-900 mb-2">{title}</h3>
  <p class="text-slate-500 whitespace-pre-line mb-6">
    {message}
  </p>

  <div class="mb-6">
    <label
      for="confirm-input"
      class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2"
    >
      {i18n.locale === 'kr'
        ? `아래 입력창에 "${confirmText}"를 입력하세요`
        : `Type "${confirmText}" to confirm`}
    </label>
    <input
      id="confirm-input"
      type="text"
      bind:value={input}
      onkeydown={handleKeydown}
      placeholder={confirmText}
      class="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-slate-900 bg-white focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
    />
  </div>

  <div class="flex justify-end gap-3">
    <button type="button" onclick={() => close(false)} class="btn-default">
      {cancelText}
    </button>
    <button
      type="button"
      onclick={() => close(true)}
      disabled={!isMatch}
      class="btn-primary shadow-lg transition-all transform active:scale-95 disabled:opacity-60"
    >
      {actionText}
    </button>
  </div>
</div>

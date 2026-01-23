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

<div class="p-6 max-w-md">
  <div class="flex items-center gap-3 mb-4 text-red-600 dark:text-red-400">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="lucide lucide-alert-triangle"
      ><path
        d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"
      /><path d="M12 9v4" /><path d="M12 17h.01" /></svg
    >
    <h3 class="text-lg font-bold">{title}</h3>
  </div>

  <p
    class="text-slate-600 dark:text-slate-300 whitespace-pre-line mb-4 text-sm leading-relaxed"
  >
    {message}
  </p>

  <div class="mb-6">
    <label
      class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2"
    >
      {i18n.locale === 'kr'
        ? `아래 입력창에 "${confirmText}"를 입력하세요`
        : `Type "${confirmText}" to confirm`}
    </label>
    <input
      type="text"
      bind:value={input}
      onkeydown={handleKeydown}
      placeholder={confirmText}
      class="w-full px-3 py-2 border-2 border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white bg-transparent focus:border-red-500/50 focus:ring-4 focus:ring-red-500/10 outline-none transition-all font-bold placeholder:font-normal placeholder:text-slate-400"
      autofocus
    />
  </div>

  <div class="flex justify-end gap-3 text-sm font-bold">
    <button
      type="button"
      onclick={() => close(false)}
      class="px-4 py-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors uppercase"
    >
      {cancelText}
    </button>
    <button
      type="button"
      onclick={() => close(true)}
      disabled={!isMatch}
      class="px-4 py-2 rounded-lg text-white transition-all transform active:scale-95 uppercase
             {isMatch
        ? 'bg-red-600 hover:bg-red-700 shadow-lg shadow-red-600/20'
        : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'}"
    >
      {actionText}
    </button>
  </div>
</div>

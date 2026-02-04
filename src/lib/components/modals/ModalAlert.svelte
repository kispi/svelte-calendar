<script lang="ts">
  import { i18n } from '$lib/i18n.svelte.js'

  interface AlertProps {
    title?: string
    message: string
    confirmText?: string
    close?: (value?: boolean) => void
  }

  let {
    title = undefined,
    message,
    confirmText = i18n.t('common.confirm'),
    close = () => {}
  }: AlertProps = $props()
</script>

<div class="p-6">
  {#if title}
    <h3 class="text-lg font-bold text-content-primary mb-2">{title}</h3>
  {/if}
  <p class="text-content-primary whitespace-pre-line mb-6">
    {message}
  </p>

  <div class="flex justify-end gap-3">
    <button type="button" onclick={() => close(true)} class="btn-primary">
      {confirmText}
    </button>
  </div>
</div>

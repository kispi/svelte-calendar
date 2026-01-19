<script lang="ts" generics="T">
  import { onMount } from 'svelte'

  interface DropdownProps {
    items: T[]
    show: boolean
    onSelect: (item: T) => void
    onClose?: () => void
    children: any
    maxHeight?: string
    containerClass?: string
  }

  let {
    items = [],
    show = false,
    onSelect,
    onClose,
    children,
    maxHeight = 'max-h-80',
    containerClass = ''
  }: DropdownProps = $props()

  let dropdownEl = $state<HTMLDivElement>()

  function handleSelect(item: T) {
    onSelect(item)
  }

  function handleClickOutside(e: MouseEvent) {
    if (show && dropdownEl && !dropdownEl.contains(e.target as Node)) {
      onClose?.()
    }
  }

  onMount(() => {
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  })
</script>

{#if show && items.length > 0}
  <div
    bind:this={dropdownEl}
    class="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 {maxHeight} overflow-y-auto z-[60] {containerClass}"
  >
    {#each items as item, index (index)}
      <button
        type="button"
        onclick={() => handleSelect(item)}
        class="w-full text-left hover:bg-gravex-green-50 transition-colors"
      >
        {@render children(item)}
      </button>
    {/each}
  </div>
{/if}

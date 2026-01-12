<script>
  import { toast } from '$lib/toast.svelte.js'
  import { fly, fade } from 'svelte/transition'
  import { flip } from 'svelte/animate'

  const positions = {
    top: 'top-6 left-1/2 -translate-x-1/2 flex-col',
    bottom: 'bottom-24 left-1/2 -translate-x-1/2 flex-col-reverse'
  }

  /** @type {Record<string, string>} */

  const styles = {
    success:
      'border-l-4 border-l-green-500 bg-slate-900/95 text-white shadow-[0_8px_30px_rgb(0,0,0,0.12)]',
    error:
      'border-l-4 border-l-red-500 bg-slate-900/95 text-white shadow-[0_8px_30px_rgb(0,0,0,0.12)]',
    info: 'border-l-4 border-l-blue-500 bg-slate-900/95 text-white shadow-[0_8px_30px_rgb(0,0,0,0.12)]',
    warning:
      'border-l-4 border-l-amber-500 bg-slate-900/95 text-white shadow-[0_8px_30px_rgb(0,0,0,0.12)]'
  }

  const icons = {
    success: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check-circle-2 text-green-400"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>`,
    error: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-alert-circle text-red-400"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>`,
    info: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-info text-blue-400"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>`,
    warning: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-alert-triangle text-amber-400"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>`
  }
</script>

{#each ['top', 'bottom'] as pos}
  <div
    class="fixed z-[200] flex gap-2 w-full max-w-md pointer-events-none {positions[
      pos
    ]}"
  >
    {#each toast.items.filter((i) => i.position === pos) as item (item.id)}
      <div
        animate:flip={{ duration: 300 }}
        transition:fly={{
          y: pos === 'top' ? -20 : 20,
          duration: 400,
          opacity: 0
        }}
        class="pointer-events-auto flex items-center gap-4 px-5 py-4 rounded-xl backdrop-blur-md {styles[
          item.type
        ]} mx-4"
        style="width: fit-content; min-width: 320px;"
      >
        <div class="flex-shrink-0">
          {@html icons[item.type]}
        </div>

        <p class="text-[14px] font-semibold leading-relaxed flex-grow">
          {item.text}
        </p>

        <button
          onclick={() => toast.dismiss(item.id)}
          class="flex-shrink-0 text-slate-400 hover:text-white transition-colors p-1"
          aria-label="Dismiss notification"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="lucide lucide-x"
            ><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg
          >
        </button>
      </div>
    {/each}
  </div>
{/each}

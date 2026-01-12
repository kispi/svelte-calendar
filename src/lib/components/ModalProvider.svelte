<script>
  import { modal } from '$lib/modal.svelte.js'
  import { fade, scale } from 'svelte/transition'
</script>

{#if modal.stack.length > 0}
  <div class="fixed inset-0 z-[100]">
    {#each modal.stack as item, i (item.id)}
      <!-- Container for Backdrop and Modal -->
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div
        class="fixed inset-0 overflow-y-auto z-[100]"
        onclick={(e) => {
          if (
            e.target === e.currentTarget &&
            !item.options.preventCloseOnClickBackdrop
          ) {
            item.resolve(false)
          }
        }}
      >
        <!-- Backdrop Backdrop (Visual) -->
        <div
          class="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] pointer-events-none"
          transition:fade|global={{ duration: 200 }}
          style="z-index: {i * 10}"
        ></div>

        <!-- Modal Box Positioning -->
        <div
          class="relative flex min-h-full items-center justify-center p-4 pointer-events-none"
          style="z-index: {i * 10 + 1}"
        >
          <div
            class="relative w-full max-w-lg overflow-hidden rounded bg-white shadow-2xl ring-1 ring-slate-200 pointer-events-auto"
            transition:scale|global={{ duration: 200, start: 0.95 }}
          >
            <svelte:component
              this={item.component}
              {...item.props}
              close={item.resolve}
            />
          </div>
        </div>
      </div>
    {/each}
  </div>
{/if}

<svelte:window
  onkeydown={(e) => {
    if (e.key === 'Escape' && modal.stack.length > 0) {
      const topModal = modal.stack[modal.stack.length - 1]
      topModal.resolve(false)
    }
  }}
/>

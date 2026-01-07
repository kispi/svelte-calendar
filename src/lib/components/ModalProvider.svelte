<script>
    import { modal } from "$lib/modal.svelte.js";
    import { fade, scale } from "svelte/transition";
</script>

{#if modal.stack.length > 0}
    <div class="fixed inset-0 z-[100] overflow-y-auto">
        <!-- Backdrop -->
        {#each modal.stack as item (item.id)}
            <div
                class="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px]"
                transition:fade={{ duration: 200 }}
            ></div>

            <div class="flex min-h-full items-center justify-center p-4">
                <div
                    class="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-slate-200"
                    transition:scale={{ duration: 200, start: 0.95 }}
                >
                    <svelte:component
                        this={item.component}
                        {...item.props}
                        close={item.resolve}
                    />
                </div>
            </div>
        {/each}
    </div>
{/if}

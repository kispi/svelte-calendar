<script lang="ts">
  import Skeleton from '$lib/components/ui/Skeleton.svelte'

  // Standard 6 weeks * 7 days
  const skeletonDays = Array.from({ length: 42 })
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
</script>

<div
  class="h-full flex flex-col bg-surface rounded border border-border-base shadow-xl overflow-hidden animate-in fade-in duration-300"
>
  <!-- Skeleton Header -->
  <div
    class="p-4 sm:p-6 flex items-center justify-between border-b border-border-base"
  >
    <div class="flex gap-2">
      <Skeleton class="h-8 w-32" />
      <Skeleton class="h-8 w-20" />
    </div>
    <div class="flex-1 max-w-md mx-4 hidden sm:block">
      <Skeleton class="h-10 w-full rounded-xl" />
    </div>
    <div class="flex gap-2">
      <Skeleton class="h-8 w-16" />
      <Skeleton class="h-8 w-8" />
      <Skeleton class="h-8 w-8" />
    </div>
  </div>

  <!-- Weekdays -->
  <div class="grid grid-cols-7 border-b border-border-base bg-surface-hover/50">
    {#each weekdays as _}
      <div class="py-3 flex justify-center">
        <Skeleton class="h-4 w-8" />
      </div>
    {/each}
  </div>

  <!-- Grid -->
  <div class="grid grid-cols-7 auto-rows-fr h-full overflow-hidden">
    {#each skeletonDays as _}
      <div
        class="border-b border-r border-border-base p-2 h-full flex flex-col"
      >
        <Skeleton class="h-6 w-6 rounded-full mb-2 shrink-0" />
        <div class="space-y-1 flex-1">
          <Skeleton class="h-4 w-full" />
          <Skeleton class="h-4 w-2/3" />
        </div>
      </div>
    {/each}
  </div>
</div>

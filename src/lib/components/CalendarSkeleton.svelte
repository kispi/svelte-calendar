<script lang="ts">
  import Skeleton from '$lib/components/ui/Skeleton.svelte'

  // Standard 6 weeks * 7 days
  const skeletonDays = Array.from({ length: 42 })
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
</script>

<div
  class="h-full flex flex-col bg-white rounded border border-slate-100 shadow-xl overflow-hidden animate-in fade-in duration-300"
>
  <!-- Skeleton Header -->
  <div
    class="p-4 sm:p-6 flex items-center justify-between border-b border-slate-100"
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
  <div class="grid grid-cols-7 border-b border-slate-100 bg-slate-50/50">
    {#each weekdays as _}
      <div class="py-3 flex justify-center">
        <Skeleton class="h-4 w-8" />
      </div>
    {/each}
  </div>

  <!-- Grid -->
  <div class="grid grid-cols-7 auto-rows-fr h-full overflow-hidden">
    {#each skeletonDays as _}
      <div class="border-b border-r border-slate-50 p-2 min-h-[80px]">
        <Skeleton class="h-6 w-6 rounded-full mb-2" />
        <div class="space-y-1">
          <Skeleton class="h-4 w-full" />
          <Skeleton class="h-4 w-2/3" />
        </div>
      </div>
    {/each}
  </div>
</div>

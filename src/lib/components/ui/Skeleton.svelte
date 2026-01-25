<script lang="ts">
  interface SkeletonProps {
    class?: string
  }
  let { class: className = '' }: SkeletonProps = $props()
</script>

<div
  class="animate-pulse rounded bg-slate-200/50 dark:bg-slate-700/50 {className}"
></div>

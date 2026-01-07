<script>
  import { onMount } from 'svelte'

  onMount(() => {
    // Notify opener and close
    if (window.opener) {
      window.close()
    } else {
      // Fallback if not in popup
      window.location.href = '/'
    }
  })
</script>

<div class="flex items-center justify-center h-screen bg-slate-50">
  <div class="text-center">
    <p class="text-slate-600 font-medium mb-2">Login successful!</p>
    <p class="text-sm text-slate-400">Closing window...</p>
  </div>
</div>

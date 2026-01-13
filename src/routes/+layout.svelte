<script lang="ts">
  import '../app.css'
  import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query'
  import type { Snippet } from 'svelte'

  let { children }: { children: Snippet } = $props()

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        enabled: true
      }
    }
  })

  import ModalProvider from '$lib/components/modals/ModalProvider.svelte'
  import ToastProvider from '$lib/components/ToastProvider.svelte'
</script>

<QueryClientProvider client={queryClient}>
  {@render children()}
  <ModalProvider />
  <ToastProvider />
</QueryClientProvider>

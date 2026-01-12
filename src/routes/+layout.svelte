<script>
  import '../app.css'
  import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query'

  let { children } = $props()

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        enabled: true
      }
    }
  })

  import ModalProvider from '$lib/components/ModalProvider.svelte'
  import ToastProvider from '$lib/components/ToastProvider.svelte'
</script>

<QueryClientProvider client={queryClient}>
  {@render children()}
  <ModalProvider />
  <ToastProvider />
</QueryClientProvider>

<script>
  import favicon from '$lib/assets/favicon.svg'
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

<svelte:head>
  <link rel="icon" href={favicon} />
</svelte:head>

<QueryClientProvider client={queryClient}>
  {@render children()}
  <ModalProvider />
  <ToastProvider />
</QueryClientProvider>

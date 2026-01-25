<script lang="ts">
  import { i18n } from '$lib/i18n.svelte.js'

  interface NavigationProps {
    lat: number
    lng: number
    name: string
    placeId?: string
    close: (value?: any) => void
  }

  let { lat, lng, name, placeId, close }: NavigationProps = $props()

  let apps = $derived([
    {
      id: 'naver',
      name: 'Naver Map',
      // Naver 'N' Symbol
      iconSvg: `<svg viewBox="0 0 24 24" fill="none" class="w-6 h-6" xmlns="http://www.w3.org/2000/svg"><path d="M16.2 3.6V10.8L7.8 3.6H3V20.4H7.8V13.2L16.2 20.4H21V3.6H16.2Z" fill="currentColor"/></svg>`,
      color:
        'bg-[#03C75A] text-white hover:bg-[#02b351] border-transparent shadow shadow-emerald-900/10',
      url: `https://map.naver.com/p/search/${encodeURIComponent(name)}`
    },
    {
      id: 'kakao',
      name: 'Kakao Map',
      // Kakao Bubble / K
      iconSvg: `<svg viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6" xmlns="http://www.w3.org/2000/svg"><path d="M12 3C6.48 3 2 6.58 2 11C2 13.92 3.96 16.5 6.86 17.93C6.67 18.61 6.27 20.06 6.18 20.41C6.07 20.84 6.53 21.05 6.82 20.85C7.29 20.52 9.4 19.07 10.38 18.39C10.91 18.47 11.45 18.5 12 18.5C17.52 18.5 22 14.92 22 10.5C22 6.08 17.52 3 12 3Z"/></svg>`,
      color:
        'bg-[#FEE500] text-[#191919] hover:bg-[#ebd400] border-transparent shadow shadow-yellow-900/10',
      url: placeId
        ? `https://map.kakao.com/link/map/${placeId}`
        : `https://map.kakao.com/link/map/${name},${lat},${lng}`
    },
    {
      id: 'google',
      name: 'Google Maps',
      // Google 'G' Logo
      iconSvg: `<svg viewBox="0 0 24 24" class="w-6 h-6" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>`,
      color:
        'bg-white border border-border-base text-content-primary hover:bg-gray-50',
      url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}&query_place_id=`
    }
  ])

  const openApp = (app: (typeof apps)[0]) => {
    // For now, simple window.open.
    // In a real PWA + Capacitor context, we might check platform.
    window.open(app.url, '_blank')
    close()
  }
</script>

<div class="p-6 text-center">
  <h3 class="text-lg font-bold text-content-primary mb-6">
    {i18n.t('navigation.title')}
  </h3>

  <div class="grid gap-3">
    {#each apps as app}
      <button
        onclick={() => openApp(app)}
        class="flex items-center gap-4 p-4 rounded-xl transition-all active:scale-95 border {app.color}"
      >
        <span
          class="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-lg shrink-0"
        >
          <!-- Display SVG Icon -->
          {@html app.iconSvg}
        </span>
        <span class="font-bold text-lg">{app.name}</span>
      </button>
    {/each}
  </div>

  <button onclick={() => close()} class="btn-default mt-6">
    {i18n.t('common.cancel')}
  </button>
</div>

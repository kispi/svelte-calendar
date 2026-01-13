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
      icon: 'N', // You can replace with SVG
      color: 'bg-[#03C75A] text-white',
      // Naver: Search by name (which usually finds the place better than coords)
      url: `https://map.naver.com/p/search/${encodeURIComponent(name)}`
    },
    {
      id: 'kakao',
      name: 'Kakao Map',
      icon: 'K',
      color: 'bg-[#FEE500] text-black',
      // Kakao: Use Place ID if available, otherwise fallback to "link/map" with name
      url: placeId
        ? `https://map.kakao.com/link/map/${placeId}`
        : `https://map.kakao.com/link/map/${name},${lat},${lng}`
    },
    {
      id: 'google',
      name: 'Google Maps',
      icon: 'G',
      color: 'bg-white border border-slate-200 text-slate-700',
      // Google: Search by name near the coordinates
      url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}&query_place_id=`
    }
  ])

  function openApp(app: (typeof apps)[0]) {
    // For now, simple window.open.
    // In a real PWA + Capacitor context, we might check platform.
    window.open(app.url, '_blank')
    close()
  }
</script>

<div class="p-6 text-center">
  <h3 class="text-lg font-bold text-slate-900 mb-6">
    {i18n.locale === 'kr' ? '길안내 앱 선택' : 'Navigate with...'}
  </h3>

  <div class="grid gap-3">
    {#each apps as app}
      <button
        onclick={() => openApp(app)}
        class="flex items-center gap-4 p-4 rounded-xl transition-transform active:scale-95 shadow-sm {app.color}"
      >
        <span
          class="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-lg"
        >
          {app.icon}
        </span>
        <span class="font-bold text-lg">{app.name}</span>
      </button>
    {/each}
  </div>

  <button
    onclick={() => close()}
    class="mt-6 text-slate-400 hover:text-slate-600 font-medium text-sm"
  >
    {i18n.t('common.cancel')}
  </button>
</div>

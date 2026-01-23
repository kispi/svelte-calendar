<script lang="ts">
  import { i18n } from '$lib/i18n.svelte.js'

  interface LocaleModalProps {
    close: (value: any) => void
  }

  let { close }: LocaleModalProps = $props()

  const options: {
    code: 'kr' | 'en'
    label: string
    sub: string
    icon: string
  }[] = [
    { code: 'kr', label: 'South Korea', sub: '한국', icon: '🇰🇷' },
    { code: 'en', label: 'United States', sub: 'United States', icon: '🇺🇸' }
  ]

  const handleSelect = (code: 'en' | 'kr') => {
    i18n.setLocale(code)
    close(true)
  }
</script>

<div class="relative pt-12 pb-8 px-8" role="document">
  <button
    onclick={() => close(false)}
    class="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
    aria-label="Close"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2.5"
      stroke-linecap="round"
      stroke-linejoin="round"
      ><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg
    >
  </button>

  <div class="mb-8">
    <h2 class="text-2xl font-black text-slate-900 tracking-tight">
      {i18n.t('locale.title')}
    </h2>
    <p class="text-sm text-slate-400 mt-1 font-medium">
      Choose your preferred display language and region.
    </p>
  </div>

  <div class="space-y-3">
    {#each options as opt}
      <button
        onclick={() => handleSelect(opt.code)}
        class="w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all group
          {i18n.locale === opt.code
          ? 'border-gravex-primary-500 bg-gravex-primary-50/30'
          : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'}"
      >
        <div class="flex items-center gap-4">
          <span class="text-3xl filter saturate-[0.8]">{opt.icon}</span>
          <div class="text-left">
            <div
              class="font-bold text-slate-800 transition-colors group-hover:text-black"
            >
              {i18n.t(`locale.${opt.code}`)}
            </div>
            <div
              class="text-xs font-semibold text-slate-400 uppercase tracking-widest mt-0.5"
            >
              {opt.sub}
            </div>
          </div>
        </div>

        {#if i18n.locale === opt.code}
          <div
            class="w-6 h-6 rounded-full bg-gravex-primary-500 flex items-center justify-center shadow-lg shadow-gravex-primary-200"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              stroke-width="3"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="w-14 h-14"><polyline points="20 6 9 17 4 12" /></svg
            >
          </div>
        {/if}
      </button>
    {/each}
  </div>
</div>

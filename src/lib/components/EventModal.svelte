<script>
  import { enhance } from '$app/forms'
  import { untrack } from 'svelte'
  import { flatpicker } from '$lib/actions/flatpickr'
  import { autoResize } from '$lib/actions/autoResize'
  import ConfirmModal from './ConfirmModal.svelte'
  import dayjs from 'dayjs'
  import { modal } from '$lib/modal.svelte.js'
  import { i18n } from '$lib/i18n.svelte.js'

  /**
   * @typedef {Object} ModalProps
   * @property {any} [event]
   * @property {any} [selectedDate]
   * @property {(value?: any) => void} [close]
   */

  /** @type {ModalProps} */
  let { event = null, selectedDate, close = () => {} } = $props()

  let title = $state('')
  let description = $state('')
  let location = $state('')
  let type = $state('schedule')
  let baseDate = $state('')
  let startTime = $state('')
  let endTime = $state('')
  let searchResults = $state([])
  let showDropdown = $state(false)
  /** @type {ReturnType<typeof setTimeout>} */
  let searchTimeout

  async function performSearch(query) {
    if (!query.trim()) {
      searchResults = []
      showDropdown = false
      return
    }

    try {
      const res = await fetch(
        `/api/places/search?query=${encodeURIComponent(query)}`
      )
      if (res.ok) {
        const data = await res.json()
        searchResults = data.documents
        showDropdown = true
      }
    } catch (err) {
      console.error('Search failed', err)
    }
  }

  /** @param {Event} e */
  function handleLocationInput(e) {
    const target = /** @type {HTMLInputElement} */ (e.target)
    const query = target.value
    // location is bound, no need to set manually

    if (searchTimeout) clearTimeout(searchTimeout)

    searchTimeout = setTimeout(() => {
      performSearch(query)
    }, 300)
  }

  function handleFocus() {
    if (location && location.trim()) {
      performSearch(location)
    }
  }

  /** @param {any} place */
  function handleSelectLocation(place) {
    location = `${place.road_address_name || place.address_name} (${place.place_name})`
    showDropdown = false
    if (searchTimeout) clearTimeout(searchTimeout)
  }

  $effect(() => {
    if (event) {
      title = event.title
      description = event.description || ''
      location = event.location || ''
      type = event.type || 'schedule'
      const start = event.startTime ? dayjs(event.startTime) : dayjs()
      const end = event.endTime ? dayjs(event.endTime) : start.add(1, 'hour')
      baseDate = start.format('YYYY-MM-DD')
      startTime = start.format('HH:mm')
      endTime = end.format('HH:mm')
    } else if (selectedDate) {
      baseDate = selectedDate.format('YYYY-MM-DD')
      startTime = '09:00'
      endTime = '10:00'

      title = ''
      description = ''
      type = 'schedule'
    }
  })

  // Synchronize times: if start > end, set end = start + 1 hour
  $effect(() => {
    const s = startTime
    untrack(() => {
      if (!s || !endTime || type === 'diary') return
      const start = dayjs(`${baseDate} ${s}`)
      const end = dayjs(`${baseDate} ${endTime}`)
      if (start.isAfter(end) || start.isSame(end)) {
        endTime = start.add(1, 'hour').format('HH:mm')
      }
    })
  })

  // Synchronize times: if end < start, set start = end - 1 hour
  $effect(() => {
    const e = endTime
    untrack(() => {
      if (!startTime || !e || type === 'diary') return
      const start = dayjs(`${baseDate} ${startTime}`)
      const end = dayjs(`${baseDate} ${e}`)
      if (end.isBefore(start) || end.isSame(start)) {
        startTime = end.subtract(1, 'hour').format('HH:mm')
      }
    })
  })

  let deleteForm = $state()
  let deleteBtn = $state()

  /**
   * @param {MouseEvent} e
   */
  async function handleDelete(e) {
    e.preventDefault()
    const confirmed = await modal.show(ConfirmModal, {
      title: i18n.t('common.delete'),
      message: i18n.t('event.deleteConfirm'),
      confirmText: i18n.t('common.delete'),
      confirmClass: 'bg-red-600 hover:bg-red-700 text-white'
    })

    if (confirmed) {
      deleteForm.requestSubmit(deleteBtn)
    }
  }
</script>

<div class="relative pt-12 pb-6 px-8" role="document">
  <!-- Close Button 'X' -->
  <button
    onclick={close}
    class="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all z-10"
    aria-label="Close modal"
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
      class="lucide lucide-x"
      ><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg
    >
  </button>

  {#if showDropdown}
    <div
      class="fixed inset-0 z-0"
      onclick={() => (showDropdown = false)}
      role="presentation"
    ></div>
  {/if}

  <form
    bind:this={deleteForm}
    method="POST"
    action={event ? '?/update' : '?/create'}
    use:enhance={({ formData, action }) => {
      const isDelete = action.search.includes('delete')

      if (!isDelete) {
        const currentType = formData.get('type')
        const startRaw = formData.get('startTime')
        const endRaw = formData.get('endTime')

        if (currentType === 'diary') {
          formData.set('startTime', dayjs(`${baseDate} 00:00:00`).toISOString())
          formData.set('endTime', dayjs(`${baseDate} 23:59:59`).toISOString())
        } else {
          if (startRaw) {
            formData.set(
              'startTime',
              dayjs(`${baseDate} ${startRaw.toString()}`).toISOString()
            )
          }
          if (endRaw) {
            formData.set(
              'endTime',
              dayjs(`${baseDate} ${endRaw.toString()}`).toISOString()
            )
          }
        }
      }

      return async ({ result, update }) => {
        await update()
        if (result.type === 'success') {
          close({ success: true })
        }
      }
    }}
    class="space-y-6"
  >
    {#if event}
      <input type="hidden" name="id" value={event.id} />
    {/if}

    <!-- Hero Title Section -->
    <div class="group">
      <input
        type="text"
        name="title"
        id="title"
        bind:value={title}
        required
        class="w-full text-2xl font-black text-slate-900 border-b-2 border-transparent focus:border-justodo-green-500 outline-none transition-all placeholder:text-slate-200 pb-2"
        placeholder={i18n.t('event.title')}
        aria-label={i18n.t('event.title')}
      />
    </div>

    <!-- Time Section -->
    <div class="flex items-start gap-4">
      <div class="text-slate-400">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="lucide lucide-clock"
          ><circle cx="12" cy="12" r="10" /><polyline
            points="12 6 12 12 16 14"
          /></svg
        >
      </div>
      <div class="flex-1">
        <div class="text-sm font-semibold text-slate-700 h-6 flex items-center">
          {baseDate
            ? dayjs(baseDate).format(
                i18n.locale === 'kr'
                  ? 'YYYY년 M월 D일 (ddd)'
                  : 'MMMM D, YYYY (ddd)'
              )
            : ''}
        </div>

        <div class="h-10 flex items-center">
          {#if type !== 'diary'}
            <div class="flex items-center gap-2">
              <input
                name="startTime"
                id="startTime"
                use:flatpicker={{
                  defaultDate: startTime,
                  noCalendar: true,
                  enableTime: true,
                  dateFormat: 'H:i',
                  allowInput: true
                }}
                bind:value={startTime}
                class="w-24 px-2 py-1.5 rounded border border-transparent hover:border-slate-200 focus:border-justodo-green-400 focus:ring-1 focus:ring-justodo-green-100 outline-none transition-all text-sm font-medium text-slate-600 bg-slate-50/50"
                aria-label={i18n.t('event.startTime')}
              />
              <span class="text-slate-300">−</span>
              <input
                name="endTime"
                id="endTime"
                use:flatpicker={{
                  defaultDate: endTime,
                  noCalendar: true,
                  enableTime: true,
                  dateFormat: 'H:i',
                  allowInput: true
                }}
                bind:value={endTime}
                class="w-24 px-2 py-1.5 rounded border border-transparent hover:border-slate-200 focus:border-justodo-green-400 focus:ring-1 focus:ring-justodo-green-100 outline-none transition-all text-sm font-medium text-slate-600 bg-slate-50/50"
                aria-label={i18n.t('event.endTime')}
              />
            </div>
          {:else}
            <div
              class="text-[11px] font-bold px-2 py-0.5 bg-justodo-green-50 text-justodo-green-600 rounded inline-block w-fit"
            >
              {i18n.t('event.allDayDiary')}
            </div>
            <input type="hidden" name="startTime" value={startTime} />
            <input type="hidden" name="endTime" value={endTime} />
          {/if}
        </div>
      </div>
    </div>

    <!-- Location Section -->
    <div class="flex items-center gap-4 relative z-20">
      <div class="text-slate-400">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="lucide lucide-map-pin"
          ><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0" /><circle
            cx="12"
            cy="10"
            r="3"
          /></svg
        >
      </div>
      <div class="flex-1 relative">
        <input
          type="text"
          name="location"
          id="location"
          bind:value={location}
          oninput={handleLocationInput}
          onfocus={handleFocus}
          autocomplete="off"
          class="w-full px-0 py-1 border-b border-transparent focus:border-justodo-green-400 outline-none transition-all text-sm placeholder:text-slate-300"
          placeholder={i18n.t('event.location')}
          aria-label={i18n.t('event.location')}
        />
        {#if showDropdown && searchResults.length > 0}
          <div
            class="absolute top-full left-0 w-full bg-white rounded-lg shadow-xl border border-slate-100 mt-1 max-h-48 overflow-y-auto z-50"
          >
            {#each searchResults as place}
              <button
                type="button"
                onmousedown={(e) => e.preventDefault()}
                onclick={() => handleSelectLocation(place)}
                class="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0"
              >
                <div class="font-bold text-slate-800">{place.place_name}</div>
                <div class="text-xs text-slate-400 truncate">
                  {place.road_address_name || place.address_name}
                </div>
              </button>
            {/each}
          </div>
        {/if}
      </div>
    </div>

    <!-- Type Section -->
    <div class="flex items-center gap-4 select-none">
      <div class="text-slate-400">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="lucide lucide-tag"
          ><path d="m15 5 4 4" /><path
            d="M13 3.8a2 2 0 0 0-1.6-.6H4a2 2 0 0 0-2 2v7.4a2 2 0 0 0 .6 1.4l9 9a2 2 0 0 0 2.8 0l7-7a2 2 0 0 0 0-2.8l-9-9Z"
          /><path d="M7 7h.01" /></svg
        >
      </div>
      <div class="flex gap-4">
        <label class="flex items-center gap-2 cursor-pointer group">
          <input
            type="radio"
            name="type"
            value="schedule"
            bind:group={type}
            class="hidden"
          />
          <div
            class="w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all
            {type === 'schedule'
              ? 'border-justodo-green-500'
              : 'border-slate-300 group-hover:border-slate-400'}"
          >
            {#if type === 'schedule'}
              <div class="w-2 h-2 rounded-full bg-justodo-green-500"></div>
            {/if}
          </div>
          <span
            class="text-xs font-semibold uppercase tracking-wider transition-colors
            {type === 'schedule'
              ? 'text-slate-700'
              : 'text-slate-400 group-hover:text-slate-600'}"
            >{i18n.t('event.schedule')}</span
          >
        </label>

        <label class="flex items-center gap-2 cursor-pointer group">
          <input
            type="radio"
            name="type"
            value="diary"
            bind:group={type}
            class="hidden"
          />
          <div
            class="w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all
            {type === 'diary'
              ? 'border-justodo-green-500'
              : 'border-slate-300 group-hover:border-slate-400'}"
          >
            {#if type === 'diary'}
              <div class="w-2 h-2 rounded-full bg-justodo-green-500"></div>
            {/if}
          </div>
          <span
            class="text-xs font-semibold uppercase tracking-wider transition-colors
            {type === 'diary'
              ? 'text-slate-700'
              : 'text-slate-400 group-hover:text-slate-600'}"
            >{i18n.t('event.diary')}</span
          >
        </label>
      </div>
    </div>

    <!-- Description Section -->
    <div class="flex items-start gap-4">
      <div class="mt-2 text-slate-400">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="lucide lucide-text"
          ><path d="M17 6.1H3" /><path d="M21 12.1H3" /><path
            d="M15.1 18.1H3"
          /></svg
        >
      </div>
      <textarea
        name="description"
        id="description"
        bind:value={description}
        use:autoResize
        class="flex-1 px-0 py-1 bg-transparent border-b border-transparent focus:border-justodo-green-400 outline-none transition-all resize-none min-h-[40px] overflow-hidden text-sm leading-relaxed placeholder:text-slate-300"
        placeholder={i18n.t('event.description')}
        aria-label={i18n.t('event.description')}
      ></textarea>
    </div>

    <!-- Actions Section -->
    <div class="flex justify-end gap-3 pt-6 border-t border-slate-50 mt-8">
      {#if event}
        <button
          bind:this={deleteBtn}
          type="submit"
          formaction="?/delete"
          class="px-4 py-2 text-xs font-bold text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all mr-auto uppercase tracking-widest"
          onclick={handleDelete}
        >
          {i18n.t('common.delete')}
        </button>
      {/if}
      <button
        onclick={close}
        type="button"
        class="px-5 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-lg transition-all uppercase tracking-widest"
      >
        {i18n.t('common.cancel')}
      </button>
      <button
        type="submit"
        class="px-8 py-2.5 text-xs font-black text-white rounded-lg shadow-lg hover:shadow-xl transform active:scale-95 transition-all uppercase tracking-widest bg-slate-900 hover:bg-black shadow-slate-200"
      >
        {i18n.t('common.save')}
      </button>
    </div>
  </form>
</div>

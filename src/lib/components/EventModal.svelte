<script>
  import { enhance } from '$app/forms'
  import { untrack } from 'svelte'
  import { flatpicker } from '$lib/actions/flatpickr'
  import ConfirmModal from './ConfirmModal.svelte'
  import dayjs from 'dayjs'
  import { modal } from '$lib/modal.svelte.js'

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
  let type = $state('schedule')
  let baseDate = $state('')
  let startTime = $state('')
  let endTime = $state('')

  $effect(() => {
    if (event) {
      title = event.title
      description = event.description || ''
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
  /**
   * @param {MouseEvent} e
   */
  async function handleDelete(e) {
    e.preventDefault()
    const confirmed = await modal.show(ConfirmModal, {
      title: 'Delete Event',
      message:
        'Are you sure you want to delete this event? This action cannot be undone.',
      confirmText: 'Delete',
      confirmClass: 'bg-red-600 hover:bg-red-700 text-white'
    })

    if (confirmed) {
      deleteForm.requestSubmit()
    }
  }
</script>

<div class="relative p-6" role="document">
  <!-- Close Button 'X' -->
  <button
    onclick={close}
    class="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
    aria-label="Close modal"
  >
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
      ><line x1="18" y1="6" x2="6" y2="18"></line><line
        x1="6"
        y1="6"
        x2="18"
        y2="18"
      ></line></svg
    >
  </button>

  <h2 class="text-2xl font-bold text-justodo-green-600 mb-2">
    {event ? 'Edit Event' : 'New Event'}
  </h2>
  <div class="mb-6 flex items-center gap-2 text-slate-500">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="lucide lucide-calendar"
      ><rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect><line
        x1="16"
        y1="2"
        x2="16"
        y2="6"
      ></line><line x1="8" y1="2" x2="8" y2="6"></line><line
        x1="3"
        y1="10"
        x2="21"
        y2="10"
      ></line></svg
    >
    <span class="text-sm font-medium"
      >{baseDate ? dayjs(baseDate).format('MMMM D, YYYY (ddd)') : ''}</span
    >
  </div>

  <form
    bind:this={deleteForm}
    method="POST"
    action={event ? '?/update' : '?/create'}
    use:enhance={({ formData, action }) => {
      // If it's a delete action, no need for date processing
      if (action.search.includes('delete')) return

      const currentType = formData.get('type')
      const startRaw = formData.get('startTime')
      const endRaw = formData.get('endTime')

      if (currentType === 'diary') {
        // Set to full day for diary using the fixed baseDate
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

      return async ({ result, update }) => {
        await update()
        if (result.type === 'success') {
          close({ success: true })
        }
      }
    }}
    class="space-y-4"
  >
    {#if event}
      <input type="hidden" name="id" value={event.id} />
    {/if}

    <div>
      <label for="title" class="block text-sm font-medium text-slate-700 mb-1"
        >Title</label
      >
      <input
        type="text"
        name="title"
        id="title"
        bind:value={title}
        required
        class="w-full px-4 py-2 rounded border border-slate-200 focus:border-justodo-green-400 focus:ring-2 focus:ring-justodo-green-200 outline-none transition-all"
        placeholder="Title"
      />
    </div>

    <div>
      <span class="block text-sm font-medium text-slate-700 mb-1">Type</span>
      <div class="flex gap-4">
        <label class="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="type"
            value="schedule"
            bind:group={type}
            class="text-justodo-green-600 focus:ring-justodo-green-500"
          />
          <span class="text-sm text-slate-600">Schedule</span>
        </label>
        <label class="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="type"
            value="diary"
            bind:group={type}
            class="text-purple-600 focus:ring-purple-500"
          />
          <span class="text-sm text-slate-600">Diary</span>
        </label>
      </div>
    </div>

    <div>
      <label
        for="description"
        class="block text-sm font-medium text-slate-700 mb-1">Description</label
      >
      <textarea
        name="description"
        id="description"
        bind:value={description}
        class="w-full px-4 py-2 rounded border border-slate-200 focus:border-justodo-green-400 focus:ring-2 focus:ring-justodo-green-200 outline-none transition-all resize-none h-24"
        placeholder="Add details..."
      ></textarea>
    </div>

    {#if type !== 'diary'}
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label
            for="startTime"
            class="block text-sm font-medium text-slate-700 mb-1">Start</label
          >
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
            class="w-full px-3 py-2 rounded border border-slate-200 focus:border-justodo-green-400 focus:ring-2 focus:ring-justodo-green-200 outline-none transition-all text-sm"
          />
        </div>
        <div>
          <label
            for="endTime"
            class="block text-sm font-medium text-slate-700 mb-1">End</label
          >
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
            class="w-full px-3 py-2 rounded border border-slate-200 focus:border-justodo-green-400 focus:ring-2 focus:ring-justodo-green-200 outline-none transition-all text-sm"
          />
        </div>
      </div>
    {:else}
      <!-- Hidden inputs to provide base date for Diary type when time inputs are not rendered -->
      <input type="hidden" name="startTime" value={startTime} />
      <input type="hidden" name="endTime" value={endTime} />
    {/if}

    <div class="flex justify-end gap-3 pt-4">
      {#if event}
        <button
          type="submit"
          formaction="?/delete"
          class="px-4 py-2 text-sm font-medium text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-all mr-auto"
          onclick={handleDelete}
        >
          Delete
        </button>
      {/if}
      <button
        type="submit"
        class="px-8 py-2.5 text-sm font-bold text-white rounded shadow-sm hover:shadow-md transform active:scale-95 transition-all
                {type === 'diary'
          ? 'bg-purple-600 hover:bg-purple-700'
          : 'bg-slate-800 hover:bg-slate-900'}
                "
      >
        Save Event
      </button>
    </div>
  </form>
</div>

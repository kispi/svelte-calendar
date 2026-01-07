<script>
  import { enhance } from '$app/forms'
  import { flatpicker } from '$lib/actions/flatpickr'
  import dayjs from 'dayjs'

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
  let startTime = $state('')
  let endTime = $state('')

  $effect(() => {
    if (event) {
      title = event.title
      description = event.description || ''
      type = event.type || 'schedule'
      startTime = event.startTime
        ? dayjs(event.startTime).format('YYYY-MM-DD HH:mm')
        : ''
      endTime = event.endTime
        ? dayjs(event.endTime).format('YYYY-MM-DD HH:mm')
        : ''
    } else if (selectedDate) {
      // selectedDate is a dayjs object from CalendarGrid
      const start = selectedDate.hour(9).minute(0)
      const end = selectedDate.hour(10).minute(0)

      startTime = start.format('YYYY-MM-DD HH:mm')
      endTime = end.format('YYYY-MM-DD HH:mm')

      title = ''
      description = ''
      type = 'schedule'
    }
  })
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

  <h2 class="text-2xl font-bold text-maple-orange-600 mb-6">
    {event ? 'Edit Event' : 'New Event'}
  </h2>

  <form
    method="POST"
    action={event ? '?/update' : '?/create'}
    use:enhance={({ formData }) => {
      // Convert local strings from flatpickr to UTC ISO strings using dayjs
      const startRaw = formData.get('startTime')
      const endRaw = formData.get('endTime')

      if (startRaw) {
        formData.set('startTime', dayjs(startRaw.toString()).toISOString())
      }
      if (endRaw) {
        formData.set('endTime', dayjs(endRaw.toString()).toISOString())
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
        class="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-maple-orange-400 focus:ring-2 focus:ring-maple-orange-200 outline-none transition-all"
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
            class="text-maple-orange-600 focus:ring-maple-orange-500"
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
        class="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-maple-orange-400 focus:ring-2 focus:ring-maple-orange-200 outline-none transition-all resize-none h-24"
        placeholder="Add details..."
      ></textarea>
    </div>

    <div class="grid grid-cols-2 gap-4">
      <div>
        <label
          for="startTime"
          class="block text-sm font-medium text-slate-700 mb-1">Start</label
        >
        <input
          name="startTime"
          id="startTime"
          use:flatpicker={{ defaultDate: startTime }}
          bind:value={startTime}
          class="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-maple-orange-400 focus:ring-2 focus:ring-maple-orange-200 outline-none transition-all text-sm"
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
            minTime: startTime.split(' ')[1]
          }}
          bind:value={endTime}
          class="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-maple-orange-400 focus:ring-2 focus:ring-maple-orange-200 outline-none transition-all text-sm"
        />
      </div>
    </div>

    <div class="flex justify-end gap-3 pt-4">
      {#if event}
        <button
          type="submit"
          formaction="?/delete"
          class="px-4 py-2 text-sm font-medium text-red-500 hover:bg-red-50 rounded-lg transition-colors mr-auto"
          onclick={(e) => {
            if (!confirm('Delete this event?')) e.preventDefault()
          }}
        >
          Delete
        </button>
      {/if}
      <button
        type="submit"
        class="px-8 py-2 text-sm font-bold text-white rounded-xl shadow-md hover:shadow-lg transform active:scale-95 transition-all
                {type === 'diary'
          ? 'bg-gradient-to-r from-purple-500 to-purple-600 hover:to-purple-700'
          : 'bg-gradient-to-r from-maple-orange-500 to-maple-orange-600 hover:to-maple-orange-700'}
                "
      >
        Save Event
      </button>
    </div>
  </form>
</div>

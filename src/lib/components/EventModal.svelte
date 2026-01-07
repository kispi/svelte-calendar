<script>
    import { enhance } from "$app/forms";
    import { flatpicker } from "$lib/actions/flatpickr";

    /**
     * @typedef {Object} ModalProps
     * @property {boolean} [isOpen]
     * @property {any} [event]
     * @property {() => void} [onClose]
     * @property {Date | null} [selectedDate]
     */

    /** @type {ModalProps} */
    let { isOpen = false, event = null, onClose, selectedDate } = $props();

    let title = $state("");
    let description = $state("");
    let type = $state("schedule");
    let startTime = $state("");
    let endTime = $state("");

    $effect(() => {
        if (event) {
            title = event.title;
            description = event.description || "";
            type = event.type || "schedule";
            startTime = event.startTime
                ? new Date(event.startTime)
                      .toISOString()
                      .slice(0, 16)
                      .replace("T", " ")
                : "";
            endTime = event.endTime
                ? new Date(event.endTime)
                      .toISOString()
                      .slice(0, 16)
                      .replace("T", " ")
                : "";
        } else if (selectedDate) {
            const start = new Date(selectedDate);
            start.setHours(9, 0, 0, 0);
            const end = new Date(selectedDate);
            end.setHours(10, 0, 0, 0);

            // Simple formatting for flatpickr defaults
            /** @param {Date} d */
            const format = (d) => {
                const offset = d.getTimezoneOffset() * 60000;
                return new Date(d.getTime() - offset)
                    .toISOString()
                    .slice(0, 16)
                    .replace("T", " ");
            };

            startTime = format(start);
            endTime = format(end);

            title = "";
            description = "";
            type = "schedule";
        }
    });

    function close() {
        if (onClose) onClose();
    }

    /** @param {MouseEvent} e */
    function handleBackdropClick(e) {
        if (e.target === e.currentTarget) {
            close();
        }
    }
</script>

{#if isOpen}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <div
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        tabindex="-1"
        onclick={handleBackdropClick}
    >
        <div
            class="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden transform transition-all scale-100 p-6"
            role="document"
        >
            <h2 class="text-2xl font-bold text-maple-orange-600 mb-4">
                {event ? "Edit Event" : "New Event"}
            </h2>

            <form
                method="POST"
                action={event ? "?/update" : "?/create"}
                use:enhance={() => {
                    return async ({ result, update }) => {
                        await update();
                        if (result.type === "success") {
                            close();
                        }
                    };
                }}
                class="space-y-4"
            >
                {#if event}
                    <input type="hidden" name="id" value={event.id} />
                {/if}

                <div>
                    <label
                        for="title"
                        class="block text-sm font-medium text-slate-700 mb-1"
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
                    <span class="block text-sm font-medium text-slate-700 mb-1"
                        >Type</span
                    >
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
                        class="block text-sm font-medium text-slate-700 mb-1"
                        >Description</label
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
                            class="block text-sm font-medium text-slate-700 mb-1"
                            >Start</label
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
                            class="block text-sm font-medium text-slate-700 mb-1"
                            >End</label
                        >
                        <input
                            name="endTime"
                            id="endTime"
                            use:flatpicker={{
                                defaultDate: endTime,
                                minTime: startTime.split(" ")[1],
                            }}
                            bind:value={endTime}
                            class="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-maple-orange-400 focus:ring-2 focus:ring-maple-orange-200 outline-none transition-all text-sm"
                        />
                    </div>
                </div>

                <div class="flex justify-end gap-3 pt-2">
                    {#if event}
                        <button
                            type="submit"
                            formaction="?/delete"
                            class="px-4 py-2 text-sm font-medium text-red-500 hover:bg-red-50 rounded-lg transition-colors mr-auto"
                            onclick={(e) => {
                                if (!confirm("Delete this event?"))
                                    e.preventDefault();
                            }}
                        >
                            Delete
                        </button>
                    {/if}
                    <button
                        type="button"
                        onclick={close}
                        class="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        class="px-6 py-2 text-sm font-bold text-white rounded-lg shadow-md hover:shadow-lg transform active:scale-95 transition-all
                        {type === 'diary'
                            ? 'bg-gradient-to-r from-purple-500 to-purple-600 hover:to-purple-700'
                            : 'bg-gradient-to-r from-maple-orange-500 to-maple-orange-600 hover:to-maple-orange-700'}
                        "
                    >
                        Save
                    </button>
                </div>
            </form>
        </div>
    </div>
{/if}

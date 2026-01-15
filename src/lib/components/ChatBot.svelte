<script lang="ts">
  import { slide, fade } from 'svelte/transition'
  import dayjs from 'dayjs'
  import { i18n } from '$lib/i18n.svelte.js'
  import { logger } from '$lib/logger'

  interface ChatProps {
    onMoveToDate: (date: string) => void
  }

  let { onMoveToDate }: ChatProps = $props()

  // State for Chat
  let isOpen = $state(false)
  let inputMessage = $state('')
  // Using Gemini's official Content structure for history
  let messages = $state([
    {
      role: 'model',
      parts: [
        {
          text: i18n.t('chatbot.greeting')
        }
      ]
    }
  ])
  let isLoading = $state(false)
  let chatContainer = $state<HTMLDivElement>()

  // State for Drag & Resize
  let position = $state({ x: 20, y: 20 }) // Default bottom-right offset
  let size = $state({ width: 400, height: 500 })
  let isDragging = $state(false)
  let isResizing = $state(false)
  let dragOffset = $state({ x: 0, y: 0 })
  let resizeStart = $state({ x: 0, y: 0, width: 0, height: 0 })

  // Window handlers
  function handleWindowMouseMove(e: MouseEvent) {
    if (isDragging) {
      // Calculate new position (right/bottom based)
      // Since we use right/bottom in CSS, dragging "left" increases right value
      // But purely following mouse delta is easier if we track window coordinates or just delta
      // Let's use fixed Top/Left positioning for easier drag logic, but initial position might be bottom/right.
      // Actually, standard drag uses top/left usually. Let's switch to top/left or transform.
      // Easiest is sticking to fixed top/left if we want full freedom.
      // But the layout uses `fixed bottom-4 right-4`.
      // Let's make the container fixed and use `top` / `left` derived from standard coordinates.

      // However, to keep it simple with existing flow, we can just use `transform: translate(x, y)`
      // But standard top/left is more robust for resizing + dragging.

      // Let's assume we switch the main container to be `fixed` with `style="top: {position.y}px; left: {position.x}px"`.

      position.x = e.clientX - dragOffset.x
      position.y = e.clientY - dragOffset.y
    } else if (isResizing) {
      const deltaX = e.clientX - resizeStart.x
      const deltaY = e.clientY - resizeStart.y

      const newWidth = Math.max(300, resizeStart.width + deltaX)
      const newHeight = Math.max(300, resizeStart.height + deltaY)

      size.width = newWidth
      size.height = newHeight
    }
  }

  function handleWindowMouseUp() {
    isDragging = false
    isResizing = false
  }

  function startDrag(e: MouseEvent) {
    if ((e.target as HTMLElement).closest('button')) return // Don't drag if clicking buttons
    isDragging = true
    dragOffset.x = e.clientX - position.x
    dragOffset.y = e.clientY - position.y
  }

  function startResize(e: MouseEvent) {
    e.stopPropagation() // Prevent drag
    isResizing = true
    resizeStart = {
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height
    }
  }

  // Initialize position to bottom right on first mount if not set?
  // For now let's just default to a fixed spot or calculate it.
  // To avoid jumping, let's just start at a safe spot, e.g. window.innerWidth - 420.
  function toggleChat() {
    isOpen = !isOpen
    if (isOpen) {
      // Reset to default position (bottom-rightish) and size
      const defaultWidth = 400
      const defaultHeight = 500
      const margin = 20

      let startX = window.innerWidth - defaultWidth - margin
      let startY = window.innerHeight - defaultHeight - margin

      // Ensure it's not off-screen if window is small
      if (startX < 0) startX = margin
      if (startY < 0) startY = margin

      position = { x: startX, y: startY }
      size = { width: defaultWidth, height: defaultHeight }

      scrollToBottom()
    }
  }

  // ... (sendMessage and other functions remain)

  async function sendMessage() {
    if (!inputMessage.trim() || isLoading) return

    const userMsg = { role: 'user', parts: [{ text: inputMessage }] }
    const currentMessages = [...messages, userMsg]

    // Optimistically update AI history with user message
    messages = currentMessages
    inputMessage = ''
    isLoading = true

    scrollToBottom()

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: currentMessages,
          clientDate: dayjs().toISOString() // Pass client local time
        })
      })

      if (!response.ok) throw new Error('Chat failed')

      const data = await response.json()

      // Replace history with the full turn-by-turn history from the server
      if (data.history) {
        messages = data.history
      }

      if (data.moveToDate) {
        onMoveToDate(data.moveToDate)
      }
    } catch (err) {
      logger.error('Chat error:', { error: err })
      messages = [
        ...messages,
        {
          role: 'model',
          parts: [{ text: i18n.t('chatbot.error') }]
        }
      ]
    } finally {
      isLoading = false
      scrollToBottom()
    }
  }

  function scrollToBottom() {
    setTimeout(() => {
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight
      }
    }, 0)
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // Helper to get text from parts for UI rendering
  function getMessageText(msg: any) {
    return msg.parts
      .filter((p: any) => p.text)
      .map((p: any) => p.text)
      .join('\n')
  }

  function parseMarkdown(text: string) {
    if (!text) return ''

    // 1. Code blocks
    text = text.replace(
      /```([\s\S]*?)```/g,
      '<pre class="bg-slate-800 text-white p-2 rounded my-2 overflow-x-auto text-xs"><code>$1</code></pre>'
    )

    // 2. Inline code
    text = text.replace(
      /`([^`]+)`/g,
      '<code class="bg-slate-200 text-slate-800 px-1 py-0.5 rounded text-xs font-mono">$1</code>'
    )

    // 3. Bold
    text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')

    // 4. Links
    text = text.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" target="_blank" class="text-blue-500 hover:underline">$1</a>'
    )

    // 5. Line breaks to <br>
    text = text.replace(/\n/g, '<br>')

    return text
  }
</script>

<svelte:window
  onmousemove={handleWindowMouseMove}
  onmouseup={handleWindowMouseUp}
/>

{#if isOpen}
  <!-- Draggable Chat Window -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    style="left: {position.x}px; top: {position.y}px; width: {size.width}px; height: {size.height}px;"
    class="fixed z-50 flex flex-col bg-white/95 backdrop-blur-sm rounded-lg shadow-2xl border border-slate-200 overflow-hidden"
  >
    <!-- Header (Draggable) -->
    <div
      onmousedown={startDrag}
      class="bg-justodo-green-600/90 p-4 flex items-center justify-between shadow-sm cursor-move select-none"
    >
      <div class="flex items-center gap-2">
        <div class="w-2 h-2 bg-green-300 rounded-full"></div>
        <span class="text-white font-bold text-sm tracking-tight"
          >{i18n.t('chatbot.title')}</span
        >
      </div>
      <button
        onclick={() => (isOpen = false)}
        aria-label="Close Chat"
        class="text-white/80 hover:text-white p-1 rounded-md transition-colors cursor-pointer"
        onmousedown={(e) => e.stopPropagation()}
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
    </div>

    <!-- Messages -->
    <div
      bind:this={chatContainer}
      class="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 scroll-smooth custom-scrollbar"
    >
      {#each messages as msg}
        {@const text = getMessageText(msg)}
        {#if text}
          <div
            class="flex {msg.role === 'user' ? 'justify-end' : 'justify-start'}"
          >
            <div
              class="max-w-[85%] px-4 py-2.5 rounded-lg text-sm shadow-sm break-words
                       {msg.role === 'user'
                ? 'bg-justodo-green-600 text-white rounded-br-none'
                : 'bg-white/80 text-slate-700 border border-slate-100 rounded-bl-none'}"
            >
              <!-- eslint-disable-next-line svelte/no-at-html-tags -->
              {@html parseMarkdown(text)}
            </div>
          </div>
        {/if}
      {/each}
      {#if isLoading}
        <div class="flex justify-start">
          <div
            class="bg-white/80 px-4 py-2.5 rounded-lg border border-slate-100 flex gap-1 items-center shadow-sm"
          >
            <div class="w-1.5 h-1.5 bg-slate-300 rounded-full"></div>
            <div class="w-1.5 h-1.5 bg-slate-400 rounded-full"></div>
            <div class="w-1.5 h-1.5 bg-slate-300 rounded-full"></div>
          </div>
        </div>
      {/if}
    </div>

    <!-- Input -->
    <div class="p-4 bg-white/80 border-t border-slate-100">
      <div class="relative flex items-center gap-2">
        <textarea
          bind:value={inputMessage}
          onkeydown={handleKeydown}
          placeholder={i18n.t('chatbot.placeholder')}
          rows="1"
          class="w-full bg-slate-50/50 border border-slate-200 rounded-md px-4 py-2.5 text-sm outline-none focus:border-justodo-green-400 focus:ring-1 focus:ring-justodo-green-200 transition-all resize-none max-h-32"
        ></textarea>
        <button
          onclick={sendMessage}
          disabled={!inputMessage.trim() || isLoading}
          aria-label="Send Message"
          class="bg-justodo-green-600 hover:bg-justodo-green-700 disabled:bg-slate-300 text-white p-2.5 rounded-md transition-all shadow-sm active:scale-95 shrink-0"
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
            ><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></svg
          >
        </button>
      </div>
    </div>

    <!-- Resize Handle -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      onmousedown={startResize}
      class="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize flex items-center justify-center opacity-50 hover:opacity-100"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        class="w-3 h-3 text-slate-400 transform rotate-90"
      >
        <path
          fill-rule="evenodd"
          d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z"
          clip-rule="evenodd"
        />
        <!-- Actually just simple lines is better for resize handle -->
        <path d="M22 22L12 22L22 12Z" fill="currentColor" />
      </svg>
    </div>
  </div>
{/if}

<!-- Toggle Button (Fixed position independently) -->
<div
  class="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-4 pointer-events-none"
>
  <div class="relative">
    <button
      onclick={toggleChat}
      class="pointer-events-auto bg-justodo-green-600 hover:bg-justodo-green-700 text-white p-4 rounded-full shadow-2xl transition-all transform hover:scale-110 active:rotate-12 group relative"
    >
      {#if isOpen}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          ><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg
        >
      {:else}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="group-hover:rotate-12 transition-transform"
          ><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" /><path
            d="M8 12h.01"
          /><path d="M12 12h.01" /><path d="M16 12h.01" /></svg
        >
      {/if}
    </button>
  </div>
</div>

<style>
  .custom-scrollbar::-webkit-scrollbar {
    width: 4px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background-color: #a7f3d0;
    border-radius: 20px;
  }
</style>

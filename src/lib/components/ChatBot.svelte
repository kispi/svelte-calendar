<script>
  import { slide, fade } from 'svelte/transition'
  import dayjs from 'dayjs'
  import { i18n } from '$lib/i18n.svelte.js'

  /**
   * @typedef {Object} ChatProps
   * @property {(date: string) => void} onMoveToDate
   */

  /** @type {ChatProps} */
  let { onMoveToDate } = $props()

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
  let chatContainer = $state()

  $effect(() => {
    if (isOpen) {
      scrollToBottom()
    }
  })

  async function sendMessage() {
    if (!inputMessage.trim() || isLoading) return

    const userMsg = { role: 'user', parts: [{ text: inputMessage }] }
    const currentMessages = [...messages, userMsg]

    // Optimistically update AI history with user message
    messages = currentMessages
    const currentInput = inputMessage
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
    }, 50)
  }

  /** @param {KeyboardEvent} e */
  function handleKeydown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // Helper to get text from parts for UI rendering
  function getMessageText(msg) {
    return msg.parts
      .filter((p) => p.text)
      .map((p) => p.text)
      .join('\n')
  }

  function parseMarkdown(text) {
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

<div
  class="fixed bottom-4 right-1/2 translate-x-1/2 z-50 w-full max-w-7xl px-4 sm:px-6 lg:px-8 pointer-events-none"
>
  <div class="relative w-full">
    <div class="absolute bottom-0 right-0 flex flex-col items-end gap-4">
      {#if isOpen}
        <div
          transition:slide={{ axis: 'y', duration: 300 }}
          class="w-[350px] sm:w-[400px] h-[500px] bg-white rounded-lg shadow-2xl border border-slate-200 flex flex-col overflow-hidden pointer-events-auto"
        >
          <!-- Header -->
          <div
            class="bg-justodo-green-600 p-4 flex items-center justify-between shadow-sm"
          >
            <div class="flex items-center gap-2">
              <div
                class="w-2 h-2 bg-green-300 rounded-full animate-pulse"
              ></div>
              <span class="text-white font-bold text-sm tracking-tight"
                >{i18n.t('chatbot.title')}</span
              >
            </div>
            <button
              onclick={() => (isOpen = false)}
              aria-label="Close Chat"
              class="text-white/80 hover:text-white p-1 rounded-md transition-colors"
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
                  class="flex {msg.role === 'user'
                    ? 'justify-end'
                    : 'justify-start'}"
                  in:fade
                >
                  <div
                    class="max-w-[85%] px-4 py-2.5 rounded-lg text-sm shadow-sm
                       {msg.role === 'user'
                      ? 'bg-justodo-green-600 text-white rounded-br-none'
                      : 'bg-white text-slate-700 border border-slate-100 rounded-bl-none'}"
                  >
                    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
                    {@html parseMarkdown(text)}
                  </div>
                </div>
              {/if}
            {/each}
            {#if isLoading}
              <div class="flex justify-start" in:fade>
                <div
                  class="bg-white px-4 py-2.5 rounded-lg border border-slate-100 flex gap-1 items-center shadow-sm"
                >
                  <div
                    class="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce"
                  ></div>
                  <div
                    class="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"
                  ></div>
                  <div
                    class="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.4s]"
                  ></div>
                </div>
              </div>
            {/if}
          </div>

          <!-- Input -->
          <div class="p-4 bg-white border-t border-slate-100">
            <div class="relative flex items-center gap-2">
              <textarea
                bind:value={inputMessage}
                onkeydown={handleKeydown}
                placeholder={i18n.t('chatbot.placeholder')}
                rows="1"
                class="w-full bg-slate-50 border border-slate-200 rounded-md px-4 py-2.5 text-sm outline-none focus:border-justodo-green-400 focus:ring-1 focus:ring-justodo-green-200 transition-all resize-none max-h-32"
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
        </div>
      {/if}

      <!-- Toggle Button -->
      <button
        onclick={() => (isOpen = !isOpen)}
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

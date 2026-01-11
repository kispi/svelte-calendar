<script>
  import { slide, fade } from 'svelte/transition'

  /**
   * @typedef {Object} ChatProps
   * @property {(date: string) => void} onMoveToDate
   */

  /** @type {ChatProps} */
  let { onMoveToDate } = $props()

  let isOpen = $state(false)
  let inputMessage = $state('')
  let messages = $state([
    {
      role: 'assistant',
      content: 'Hello! I am your Justodo Assistant. How can I help you today?'
    }
  ])
  let isLoading = $state(false)
  let chatContainer = $state()

  async function sendMessage() {
    if (!inputMessage.trim() || isLoading) return

    const userMsg = { role: 'user', content: inputMessage }
    messages = [...messages, userMsg]
    const currentInput = inputMessage
    inputMessage = ''
    isLoading = true

    scrollToBottom()

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages })
      })

      if (!response.ok) throw new Error('Chat failed')

      const data = await response.json()

      messages = [...messages, { role: 'assistant', content: data.content }]

      if (data.moveToDate) {
        onMoveToDate(data.moveToDate)
      }
    } catch (err) {
      messages = [
        ...messages,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.'
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

  function handleKeydown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }
</script>

<div
  class="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4 pointer-events-none"
>
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
          <div class="w-2 h-2 bg-green-300 rounded-full animate-pulse"></div>
          <span class="text-white font-bold text-sm tracking-tight"
            >Justodo Assistant</span
          >
        </div>
        <button
          onclick={() => (isOpen = false)}
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
          <div
            class="flex {msg.role === 'user' ? 'justify-end' : 'justify-start'}"
            in:fade
          >
            <div
              class="max-w-[85%] px-4 py-2.5 rounded-lg text-sm shadow-sm
                     {msg.role === 'user'
                ? 'bg-justodo-green-600 text-white rounded-br-none'
                : 'bg-white text-slate-700 border border-slate-100 rounded-bl-none'}"
            >
              {msg.content}
            </div>
          </div>
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
            placeholder="Ask me anything..."
            rows="1"
            class="w-full bg-slate-50 border border-slate-200 rounded-md px-4 py-2.5 text-sm outline-none focus:border-justodo-green-400 focus:ring-1 focus:ring-justodo-green-200 transition-all resize-none max-h-32"
          ></textarea>
          <button
            onclick={sendMessage}
            disabled={!inputMessage.trim() || isLoading}
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
        ><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" /><path d="M8 12h.01" /><path
          d="M12 12h.01"
        /><path d="M16 12h.01" /></svg
      >
    {/if}
  </button>
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
